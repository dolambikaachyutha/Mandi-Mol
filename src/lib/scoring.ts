import { CoachFeedback, RubricBreakdown, ScorecardData, Turn } from '../types';

export interface ScoreCalculationInput {
  finalPrice: number;
  reservePrice: number;
  openingOffer: number;
  referencePrice: number;
  quantityKg: number;
  roundsTaken: number;
  tricksChallengedCount: number;
  history: Turn[];
  dealStruck: boolean;
  evonCoachFeedback?: CoachFeedback;
}

export function calculateScore(input: ScoreCalculationInput): ScorecardData {
  const {
    finalPrice,
    reservePrice,
    openingOffer,
    referencePrice,
    quantityKg,
    roundsTaken,
    tricksChallengedCount,
    history,
    dealStruck,
    evonCoachFeedback,
  } = input;

  // 1. Price Score: max 40 (strictly computed in code)
  const priceSpread = Math.max(1, reservePrice - openingOffer);
  const priceGained = Math.max(0, finalPrice - openingOffer);
  const priceRatio = Math.min(1, Math.max(0, priceGained / priceSpread));
  const priceScore = Math.round(priceRatio * 40);

  // 2. First offer not accepted: 10 pts
  const firstOfferNotAccepted = roundsTaken > 1 ? 10 : 0;

  // 3. Evidence used (market data, quality, alternate buyer): 15 pts
  const hadEvidence = history.some((t) => t.farmerEvidence);
  const evidenceUsed = hadEvidence ? 15 : 0;

  // 4. Trick countered: 15 pts
  const trickCountered = tricksChallengedCount > 0 ? 15 : 0;

  // 5. Respectful firmness: 10 pts
  const wasRespectful = history.length > 0 && history.every((t) => t.farmerRespectful);
  const respectfulFirmness = wasRespectful ? 10 : 4;

  // 6. Clean closing (mentions payment mode, APMC weight, or confirmed settlement): 10 pts
  const closingRegex = /(nagad|cash|rtgs|kanta|apmc|parchi|receipt|bill|sham|sauda|pakka|tol)/i;
  const mentionsClosing = history.some((t) => closingRegex.test(t.farmerText));
  const cleanClosing = dealStruck && mentionsClosing ? 10 : dealStruck ? 6 : 0;

  const totalScore = Math.min(
    100,
    priceScore +
      firstOfferNotAccepted +
      evidenceUsed +
      trickCountered +
      respectfulFirmness +
      cleanClosing
  );

  const moneyLeftOnTable = Math.max(0, (reservePrice - finalPrice) * quantityKg);
  const squeezedTrader = finalPrice >= reservePrice - 2;

  const rubrics: RubricBreakdown = {
    priceScore,
    firstOfferNotAccepted,
    evidenceUsed,
    trickCountered,
    respectfulFirmness,
    cleanClosing,
  };

  // Generate fallback coach feedback if Evon coach response is not provided
  const coachFeedback: CoachFeedback = evonCoachFeedback || generateDefaultCoachFeedback(
    history,
    moneyLeftOnTable,
    finalPrice,
    reservePrice,
    quantityKg,
    hadEvidence,
    tricksChallengedCount > 0
  );

  return {
    finalPrice,
    reservePrice,
    openingOffer,
    referencePrice,
    quantityKg,
    moneyLeftOnTable,
    squeezedTrader,
    totalScore,
    rubrics,
    coachFeedback,
    roundsTaken,
    dealStruck,
  };
}

function generateDefaultCoachFeedback(
  history: Turn[],
  moneyLeftOnTable: number,
  finalPrice: number,
  reservePrice: number,
  quantityKg: number,
  hadEvidence: boolean,
  counteredTrick: boolean
): CoachFeedback {
  const wentWell: string[] = [];
  const missed: string[] = [];

  if (history.length > 1) {
    wentWell.push('You held firm past the first lowball offer and negotiated through multiple rounds.');
  }
  if (hadEvidence) {
    wentWell.push('You anchored your argument with real market benchmarks and quality attributes.');
  } else {
    missed.push('You did not quote neighboring mandi prices or APMC rates to anchor your counter-ask.');
  }

  if (counteredTrick) {
    wentWell.push("You pushed back directly on Lalaji's bargaining tactic instead of swallowing it.");
  } else {
    missed.push("You accepted the trader's objection without verifying the scale rules or grade sample.");
  }

  if (moneyLeftOnTable > 1500) {
    missed.push(
      `₹${moneyLeftOnTable.toLocaleString('en-IN')} was left on the table. The trader was prepared to pay up to ₹${reservePrice}/kg for this lot.`
    );
  } else {
    wentWell.push(
      `Strong execution! You captured within ₹${Math.max(0, reservePrice - finalPrice)}/kg of the trader's maximum ceiling.`
    );
  }

  return {
    wentWell: wentWell.slice(0, 2),
    missed: missed.slice(0, 2),
    betterLines: [
      {
        original: history[0]?.farmerText || 'Bhaiya thoda badhao na',
        better:
          'Lalaji, Warangal mandi mein Teja dry ka bhav ₹190 khula hai. Mera 95% uniform grade A hai, ₹188 se kam nahi banta.',
        why: 'Anchoring with a real benchmark mandi rate shifts the negotiation from pleading to verified facts.',
      },
      {
        original: history[1]?.farmerText || 'Theek hai jo dena hai do',
        better:
          'Kanta APMC certified par hi hoga aur bhugtan aaj sham RTGS se. Udhari par maal nahi utrega.',
        why: 'Protecting net cash realization prevents traders from shaving 5-10% through delayed settlement and weight cuts.',
      },
    ],
    tone: 'Respectful, data-backed, and uncompromising on fair mandi rates.',
  };
}
