/**
 * Mandi Mol Type Definitions
 */

export type CropId = string;

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
  category?: 'spices' | 'vegetables' | 'grains' | 'oilseeds' | 'cash_crop';
  mandiHub?: string; // Famous APMC yard (e.g. "Guntur", "Azadpur", "Khanna")
}

export type QualityGrade =
  | 'Grade A (Export / Premium Quality)'
  | 'Grade B (Fair Average Quality - FAQ)'
  | 'Grade C (Standard / Local Grade)';

export type TraderStyle = 'tough' | 'fair' | 'volume' | 'nitpicker';

export type PaymentMode =
  | 'Instant RTGS (Direct Bank Transfer)'
  | 'Spot Cash on Weighbridge'
  | '15-Day Mandi Cheque (Udhaari)';

export interface FarmerProfile {
  farmerName: string;
  villageOrFpo: string;
  cropId: CropId;
  quantity: number; // in chosen unit
  quantityUnit: 'kg' | 'quintal'; // 1 quintal = 100 kg
  qualityGrade: QualityGrade;
  mandiLocation: string;
  targetPrice: number; // Asking rate in Rs/kg
  walkawayPrice: number; // Lowest acceptable in Rs/kg
  farmerTerms: string;
}

export interface TraderProfile {
  traderName: string;
  firmName: string;
  mandiLocation: string;
  openingBid: number; // Starting offer in Rs/kg
  reserveCeiling: number; // Max budget in Rs/kg
  negotiationStyle: TraderStyle;
  paymentMode: PaymentMode;
  tareDeductionKg: number; // Tare per bag in kg
  moistureCutPercent: number; // Moisture tare %
  traderTerms: string;
}

export interface MandiSaudaSlip {
  saudaNumber: string;
  timestamp: number;
  mandiYard: string;
  farmerName: string;
  villageOrFpo: string;
  traderName: string;
  traderFirm: string;
  cropName: string;
  cropVariety: string;
  qualityGrade: string;
  quantityKg: number;
  quantityQuintals: number;
  agreedRatePerKg: number;
  agreedRatePerQuintal: number;
  grossAmount: number;
  mandiCess: number;
  weighmentCharges: number;
  netPayable: number;
  paymentMode: string;
  settlementTerms: string;
  roundsTaken: number;
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

// ----------------------------------------------------------------------------
// MODULE 1: LIVE MANDI PRICES & ALERTS
// ----------------------------------------------------------------------------

export interface MandiPriceItem {
  commodity: string;
  variety: string;
  state: string;
  district: string;
  market: string;
  minPricePerKg: number;
  maxPricePerKg: number;
  modalPricePerKg: number;
  modalPriceQuintal: number;
  arrivalDate: string;
  trend7d: number[];
  trend30d: number[];
  nearbyComparison?: {
    market: string;
    modalPricePerKg: number;
    diffPct: number;
    statement: string;
  };
}

export interface NearbyMandiItem {
  market: string;
  district: string;
  state: string;
  distanceKm: number;
  modalPricePerKg: number;
  diffFromLocalRs: number;
  diffPct: number;
  statement: string;
}

export interface PricesApiResponse {
  userMandi: string;
  userDistrict: string;
  userState: string;
  source: string;
  lastUpdated: string;
  prices: MandiPriceItem[];
  nearbyMarkets: NearbyMandiItem[];
  voiceQueryHint: string;
}

export interface PriceAlert {
  id: string;
  crop_id: string;
  mandi_location: string;
  target_price_per_kg: number;
  condition: 'above' | 'below';
  is_active: boolean;
  channel: 'whatsapp' | 'push';
  phone?: string;
  created_at: string;
  currentModalPricePerKg?: number;
  isTriggered?: boolean;
  status?: string;
}

// ----------------------------------------------------------------------------
// MODULE 2: SELL PLANNER
// ----------------------------------------------------------------------------

export interface MandiNetComparison {
  market: string;
  distanceKm: number;
  modalPricePerKg: number;
  modalPriceQuintal: number;
  grossRevenueRs: number;
  transportDeductionRs: number;
  mandiFeeDeductionRs: number;
  hamaliDeductionRs: number;
  netInHandTotalRs: number;
  netPerKgRs: number;
  isBestMarket: boolean;
}

export interface SellPlanResponse {
  crop: {
    id: string;
    name: string;
    grade: string;
  };
  quantityKg: number;
  quantityQuintals: number;
  recommendedFloorPricePerKg: number;
  bestMarketToday: string;
  topTricksAtMandi: Array<{
    trick: string;
    name: string;
    description: string;
    counterMeasure: string;
  }>;
  mandiComparisons: MandiNetComparison[];
  disclaimer: string;
}

// ----------------------------------------------------------------------------
// MODULE 4: REAL DEAL LEDGER & FPO ANALYTICS
// ----------------------------------------------------------------------------

export interface RealDeal {
  id: string;
  user_id: string;
  crop_id: string;
  mandi_location: string;
  deal_type: 'sold' | 'bought';
  quantity_kg: number;
  agreed_price_per_kg: number;
  agmarknet_modal_price_per_kg: number;
  diff_vs_market_rs_per_kg: number;
  total_diff_vs_market_rs: number;
  total_gross_amount: number;
  buyer_seller_name: string;
  payment_mode: string;
  deal_date: string;
  notes?: string;
  created_at: string;
}

export interface MonthlyImpactSummary {
  month: string;
  totalDeals: number;
  totalQuantityKg: number;
  totalGrossAmount: number;
  totalDiffVsMarketRs: number;
  avgPricePerKg: number;
  practiceSessionsCompleted?: number;
}

