import { describe, expect, it } from 'vitest';
import { calculateScore } from '../src/lib/scoring';
import { Turn } from '../src/types';

describe('Scoring Engine Invariants', () => {
  const dummyHistory: Turn[] = [
    {
      round: 1,
      farmerText: 'Lalaji Warangal mandi mein 188 chal raha hai',
      farmerEvidence: true,
      farmerChallengedTrick: false,
      farmerRespectful: true,
      traderOffer: 165,
      traderMood: 'talking',
      traderLine: 'Maal mein moisture zyada hai',
      clamped: false,
      allowedMaxOffer: 190,
      telemetry: {
        stt: { transcript: '...', detectedLanguage: 'Hinglish', confidence: 0.9, latencyMs: 200 },
        engine: { allowedMaxOffer: 190, evonProposed: 165, finalOffer: 165, clamped: false },
        evon: { zodValid: true, retries: 0, latencyMs: 300 },
        timbre: { charsSynthesized: 30, latencyMs: 400, cacheHit: false, fallbackUsed: false },
        totalTurnTimeMs: 900,
      },
    },
    {
      round: 2,
      farmerText: 'Sample check kar lo APMC grade A hai. Kanta par cash hisaab hoga.',
      farmerEvidence: true,
      farmerChallengedTrick: true,
      farmerRespectful: true,
      traderOffer: 184,
      traderMood: 'deal',
      traderLine: 'Chalo theek hai 184 pakka.',
      clamped: false,
      allowedMaxOffer: 190,
      telemetry: {
        stt: { transcript: '...', detectedLanguage: 'Hinglish', confidence: 0.9, latencyMs: 200 },
        engine: { allowedMaxOffer: 190, evonProposed: 184, finalOffer: 184, clamped: false },
        evon: { zodValid: true, retries: 0, latencyMs: 300 },
        timbre: { charsSynthesized: 30, latencyMs: 400, cacheHit: false, fallbackUsed: false },
        totalTurnTimeMs: 900,
      },
    },
  ];

  it('calculates rupee money left on the table correctly', () => {
    const result = calculateScore({
      finalPrice: 180,
      reservePrice: 190,
      openingOffer: 155,
      referencePrice: 185,
      quantityKg: 500,
      roundsTaken: 3,
      tricksChallengedCount: 1,
      history: dummyHistory,
      dealStruck: true,
    });

    expect(result.moneyLeftOnTable).toBe((190 - 180) * 500); // 5000 Rs
    expect(result.totalScore).toBeGreaterThan(50);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('awards zero money left on table if farmer captures reserve', () => {
    const result = calculateScore({
      finalPrice: 190,
      reservePrice: 190,
      openingOffer: 155,
      referencePrice: 185,
      quantityKg: 500,
      roundsTaken: 4,
      tricksChallengedCount: 1,
      history: dummyHistory,
      dealStruck: true,
    });

    expect(result.moneyLeftOnTable).toBe(0);
    expect(result.squeezedTrader).toBe(true);
    expect(result.rubrics.priceScore).toBe(40);
  });
});
