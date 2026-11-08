/**
 * Mandi Mol Type Definitions
 */

export type CropId = 'chilli' | 'tomato';

export interface Crop {
  id: CropId;
  name: string;
  hindiName: string;
  variety: string;
  unit: string; // e.g. "kg" or "quintal"
  referencePrice: number; // In Rs per kg
  defaultQuantity: number; // e.g. 500 kg
  minReserveMult: number;
  maxReserveMult: number;
  minOpenMult: number;
  maxOpenMult: number;
  description: string;
  icon: string;
}

export type LanguageCode = 'hinglish' | 'hindi' | 'telugu' | 'english';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  prismaCode: string; // Prisma language_code (one code, or a comma-separated hint list)
  sttFormat: 'transcribe' | 'transliterate' | 'codemix'; // Prisma output format
  timbreCode: string; // Timbre voice name (e.g. Avinash)
  ttsLanguage: string; // Timbre language tag (e.g. hi-en)
  isRegional: boolean;
}

export type Difficulty = 'easy' | 'hard';

export type TrickId =
  | 'quality_nitpick'
  | 'false_market_drop'
  | 'fake_scarcity'
  | 'weight_cut'
  | 'delayed_payment'
  | 'friendly_pressure';

export interface Trick {
  id: TrickId;
  name: string;
  hindiName: string;
  description: string;
  hinglishExample: string;
  counterTip: string;
  icon: string;
}

export type TraderMood = 'idle' | 'talking' | 'irritated' | 'impressed' | 'deal';

export interface TurnTelemetry {
  stt: {
    transcript: string;
    detectedLanguage: string;
    confidence: number;
    latencyMs: number;
  };
  engine: {
    allowedMaxOffer: number;
    evonProposed: number;
    finalOffer: number;
    clamped: boolean;
    clampReason?: string;
  };
  evon: {
    rawPrompt?: string;
    rawResponse?: string;
    provider?: 'evon' | 'engine';
    zodValid: boolean;
    retries: number;
    latencyMs: number;
  };
  timbre: {
    charsSynthesized: number;
    latencyMs: number;
    cacheHit: boolean;
    fallbackUsed: boolean;
  };
  totalTurnTimeMs: number;
}

export interface Turn {
  round: number;
  farmerText: string;
  farmerAudioDurationMs?: number;
  farmerEvidence: boolean;
  farmerChallengedTrick: boolean;
  farmerRespectful: boolean;
  traderOffer: number;
  traderMood: TraderMood;
  traderTrick?: TrickId;
  traderLine: string;
  traderAudioBase64?: string;
  clamped: boolean;
  evonProposedOffer?: number;
  allowedMaxOffer: number;
  telemetry: TurnTelemetry;
}

export type FsmState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'deal'
  | 'walkaway'
  | 'scoring';

export interface RubricBreakdown {
  priceScore: number; // max 40
  firstOfferNotAccepted: number; // max 10
  evidenceUsed: number; // max 15
  trickCountered: number; // max 15
  respectfulFirmness: number; // max 10
  cleanClosing: number; // max 10
}

export interface CoachBetterLine {
  original: string;
  better: string;
  why: string;
}

export interface CoachFeedback {
  wentWell: string[];
  missed: string[];
  betterLines: CoachBetterLine[];
  tone: string;
}

export interface ScorecardData {
  finalPrice: number;
  reservePrice: number;
  openingOffer: number;
  referencePrice: number;
  quantityKg: number;
  moneyLeftOnTable: number;
  squeezedTrader: boolean;
  totalScore: number;
  rubrics: RubricBreakdown;
  coachFeedback: CoachFeedback;
  roundsTaken: number;
  dealStruck: boolean;
}

export interface PilotSession {
  id: string;
  timestamp: number;
  participantLabel: string; // e.g. "P1"
  attemptNumber: number;
  cropId: CropId;
  languageCode: LanguageCode;
  difficulty: Difficulty;
  score: number;
  moneyLeftOnTable: number;
  isFarmer: boolean;
  dealStruck: boolean;
  roundsCount: number;
  tricksCounteredCount: number;
}

export interface NoiseTestLog {
  id: string;
  timestamp: number;
  noiseLevel: 'off' | 'medium' | 'loud';
  snrEstimate: string;
  originalText?: string;
  recognizedTranscript: string;
  farmerConfirmedCorrect: boolean | null; // thumbs up/down
  confidence: number;
  latencyMs: number;
}

export type ProviderMode = 'live' | 'mock' | 'engine' | 'error';

export interface ProviderHealth {
  prisma: { ok: boolean; latencyMs: number; mode: ProviderMode };
  evon: { ok: boolean; latencyMs: number; mode: ProviderMode };
  timbre: { ok: boolean; latencyMs: number; mode: ProviderMode };
}
