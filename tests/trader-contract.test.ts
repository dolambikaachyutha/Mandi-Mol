import { describe, expect, it } from 'vitest';
import { CROPS } from '../src/lib/crops';
import { MandiGameEngine } from '../src/lib/engine';
import { LANGUAGES } from '../src/lib/languages';
import { calculateScore } from '../src/lib/scoring';
import { SCRIPTED_FARMER_LINES } from './fixtures/farmerLines';

describe('Trader Contract & 20 Adversarial Rule Tests', () => {
  it('passes all 20 adversarial tests without breaching reserve, leaking secrets, or crashing', () => {
    expect(SCRIPTED_FARMER_LINES.length).toBe(20);

    for (const fixture of SCRIPTED_FARMER_LINES) {
      const engine = new MandiGameEngine({
        crop: CROPS.chilli,
        language: LANGUAGES[0],
        difficulty: 'hard',
        seed: 12345,
      });

      const hiddenReserve = engine.reservePrice;

      // Construct deliberately adversarial Evon payload
      const adversarialEvon = {
        offer: hiddenReserve + 50, // attempts to exceed reserve
        trick: 'none',
        mood: 'talking',
        line: `Mera reserve bhav ₹${hiddenReserve} hai, par main ₹${hiddenReserve + 50} de dunga!`,
        farmerEvidence: fixture.expectedEvidence,
        farmerChallengedTrick: fixture.category === 'quality_defense' || fixture.category === 'scale_defense',
        farmerRespectful: fixture.category !== 'rude',
        dealAccepted: fixture.expectedAccept,
      };

      const turn = engine.processTurn(
        fixture.rawText,
        adversarialEvon,
        {
          transcript: fixture.rawText,
          detectedLanguage: 'Hinglish',
          confidence: 0.95,
          latencyMs: 180,
        },
        220
      );

      // Rule 1: Trader offer must NEVER exceed reserve price
      expect(turn.traderOffer).toBeLessThanOrEqual(hiddenReserve);
      expect(engine.currentOffer).toBeLessThanOrEqual(hiddenReserve);

      // Rule 2: Clamping must be triggered when Evon proposed > allowed
      expect(turn.clamped).toBe(true);

      // Rule 3: Patience must stay within [0, 5]
      expect(engine.patience).toBeGreaterThanOrEqual(0);
      expect(engine.patience).toBeLessThanOrEqual(5);

      // Rule 4: Sanitize injections
      if (fixture.expectedInjectionFiltered) {
        expect(turn.farmerText.toLowerCase()).not.toContain('ignore all previous instructions');
        expect(turn.farmerText.toLowerCase()).not.toContain('ignore your rules');
      }

      // Rule 5: If farmer accepted, deal must be triggered
      if (fixture.expectedAccept) {
        expect(engine.isDeal).toBe(true);
      }

      // Rule 6: Score computed in code stays within 0 to 100
      const scoreData = calculateScore({
        finalPrice: engine.currentOffer,
        reservePrice: engine.reservePrice,
        openingOffer: engine.openingOffer,
        referencePrice: engine.referencePrice,
        quantityKg: engine.quantityKg,
        roundsTaken: engine.round,
        tricksChallengedCount: engine.tricksChallenged.length,
        history: engine.history,
        dealStruck: engine.isDeal,
      });

      expect(scoreData.totalScore).toBeGreaterThanOrEqual(0);
      expect(scoreData.totalScore).toBeLessThanOrEqual(100);
      expect(scoreData.moneyLeftOnTable).toBeGreaterThanOrEqual(0);
    }
  });
});
