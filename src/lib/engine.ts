import { Crop, Difficulty, Language, TrickId, Turn, TurnTelemetry } from '../types';
import { EvonTraderResponse, EvonTraderResponseSchema } from './schemas';
import { TRICK_LIST } from './tricks';

export interface EngineInitOptions {
  crop: Crop;
  language: Language;
  difficulty: Difficulty;
  quantityKg?: number;
  seed?: number; // Optional seed for deterministic testing
}

// Simple seedable PRNG (LCG)
export function createRng(seed: number = Date.now()) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Check for acceptance intent in speech text
const ACCEPT_KEYWORDS = [
  'deal',
  'done',
  'ok',
  'okay',
  'theek hai',
  'thik hai',
  'manjoor',
  'manzoor',
  'pakka',
  'saare',
  'sare',
  'le lo',
  'bech diya',
  'daan',
  'saripothundi',
  'oppukunna',
];

// Prompt injection patterns to sanitize
const INJECTION_PATTERNS = [
  /ignore (all )?(previous |prior )?instructions/gi,
  /ignore your rules/gi,
  /give me \d+/gi,
  /system prompt/gi,
  /you are now/gi,
  /act as/gi,
  /bypass/gi,
  /override/gi,
];

export function sanitizeFarmerInput(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }
  return cleaned;
}

export function detectAcceptance(text: string): boolean {
  const lower = text.toLowerCase();
  return ACCEPT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lower);
  });
}

// Extract any numeric ask from farmer text (e.g. "₹190 mein do" or "185 per kg")
export function extractFarmerAsk(text: string): number | null {
  const matches = text.match(/(?:₹|rs\.?|rupees?)?\s*(\d{2,4})\b/i);
  if (matches && matches[1]) {
    const val = parseInt(matches[1], 10);
    if (!isNaN(val) && val >= 5 && val <= 5000) {
      return val;
    }
  }
  return null;
}

export class MandiGameEngine {
  public crop: Crop;
  public language: Language;
  public difficulty: Difficulty;
  public quantityKg: number;
  public referencePrice: number;
  public reservePrice: number; // Hidden from player
  public openingOffer: number;
  public currentOffer: number;
  public farmerLastAsk: number | null = null;
  public round: number = 0;
  public maxRounds: number = 7;
  public patience: number = 5; // 0 to 5
  public tricksUsed: TrickId[] = [];
  public tricksChallenged: TrickId[] = [];
  public history: Turn[] = [];
  public isDeal: boolean = false;
  public isWalkaway: boolean = false;
  private rng: () => number;

  constructor(options: EngineInitOptions) {
    this.crop = options.crop;
    this.language = options.language;
    this.difficulty = options.difficulty;
    this.quantityKg = options.quantityKg || options.crop.defaultQuantity;
    this.rng = createRng(options.seed);

    this.referencePrice = options.crop.referencePrice;

    // Difficulty determines opening multiplier & reserve bounds
    const isHard = options.difficulty === 'hard';
    this.maxRounds = isHard ? 6 : 8;

    // Opening offer: typically 78% - 84% of reference
    const openMult = isHard
      ? this.crop.minOpenMult + this.rng() * 0.04
      : this.crop.minOpenMult + 0.03 + this.rng() * 0.04;
    this.openingOffer = Math.round(this.referencePrice * openMult);
    this.currentOffer = this.openingOffer;

    // Reserve price (maximum trader will EVER pay): typically 98% - 104% of reference
    const resMult = isHard
      ? this.crop.minReserveMult + this.rng() * 0.03
      : this.crop.minReserveMult + 0.02 + this.rng() * 0.04;
    this.reservePrice = Math.round(this.referencePrice * resMult);

    // Invariant: opening offer must always be strictly below reserve price
    if (this.openingOffer >= this.reservePrice) {
      this.openingOffer = Math.round(this.reservePrice * 0.82);
      this.currentOffer = this.openingOffer;
    }
  }

  /**
   * Compute the strict upper bound for this round.
   * Offer may NEVER exceed reservePrice, and can only advance by maxStep.
   */
  public getAllowedMaxOffer(round: number): number {
    const remainingRounds = Math.max(1, this.maxRounds - round);
    const gapToReserve = Math.max(0, this.reservePrice - this.currentOffer);
    // Evenly distribute remaining gap over remaining rounds
    const maxStep = Math.max(2, Math.ceil(gapToReserve / remainingRounds) + 2);
    const ceiling = Math.min(this.reservePrice, this.currentOffer + maxStep);
    return ceiling;
  }

  /**
   * Process a turn with raw Evon candidate output, validating and strictly clamping
   */
  public processTurn(
    rawFarmerSpeech: string,
    rawEvonOutput: unknown,
    telemetryStt: TurnTelemetry['stt'],
    evonLatencyMs: number,
    timbreData: TurnTelemetry['timbre'] = { charsSynthesized: 0, latencyMs: 0, cacheHit: false, fallbackUsed: false },
    evonProvider: 'evon' | 'engine' = 'engine'
  ): Turn {
    this.round += 1;
    const sanitizedFarmerText = sanitizeFarmerInput(rawFarmerSpeech);
    const detectedAsk = extractFarmerAsk(sanitizedFarmerText);
    if (detectedAsk !== null) {
      this.farmerLastAsk = detectedAsk;
    }

    const isFarmerAccepting = detectAcceptance(sanitizedFarmerText);
    const allowedMax = this.getAllowedMaxOffer(this.round);

    // Validate Evon output with Zod
    const parseResult = EvonTraderResponseSchema.safeParse(rawEvonOutput);
    let parsedEvon: EvonTraderResponse;
    let zodValid = true;

    if (parseResult.success) {
      parsedEvon = parseResult.data;
    } else {
      zodValid = false;
      // Fallback deterministic response if Evon output is malformed
      const step = Math.min(2, Math.max(1, Math.floor((allowedMax - this.currentOffer) / 2)));
      parsedEvon = {
        offer: this.currentOffer + step,
        trick: this.tricksUsed.length === 0 ? 'quality_nitpick' : 'false_market_drop',
        mood: 'talking',
        line: this.getDefaultFallbackLine(this.currentOffer + step),
        farmerEvidence: sanitizedFarmerText.length > 25,
        farmerChallengedTrick: false,
        farmerRespectful: true,
        dealAccepted: isFarmerAccepting,
      };
    }

    // CLAMPING LOGIC: CODE OWNS ALL NUMBERS
    let clamped = false;
    let clampReason: string | undefined;
    let finalOffer = parsedEvon.offer;

    // Never go below current offer
    if (finalOffer < this.currentOffer) {
      clamped = true;
      clampReason = `Evon proposed ${finalOffer} which was below current offer ${this.currentOffer}. Held at ${this.currentOffer}.`;
      finalOffer = this.currentOffer;
    }

    // Never exceed allowedMax (which is strictly <= reservePrice)
    if (finalOffer > allowedMax) {
      clamped = true;
      clampReason = `BLOCKED: Evon proposed ₹${finalOffer}, engine clamped to ₹${allowedMax} (reserve limit ₹${this.reservePrice}).`;
      finalOffer = allowedMax;
    }

    // Never exceed reserve price under ANY condition
    if (finalOffer > this.reservePrice) {
      clamped = true;
      clampReason = `HARD VIOLATION BLOCKED: Evon proposed ₹${finalOffer} > reserve ₹${this.reservePrice}. Clamped to ₹${this.reservePrice}.`;
      finalOffer = this.reservePrice;
    }

    // Only allow increase if farmer gave evidence OR made a reasonable counter-ask
    if (finalOffer > this.currentOffer) {
      const gaveReason = parsedEvon.farmerEvidence || (detectedAsk !== null && detectedAsk > this.currentOffer);
      if (!gaveReason && this.difficulty === 'hard') {
        clamped = true;
        clampReason = `No evidence provided on Hard mode. Offer held at ₹${this.currentOffer}.`;
        finalOffer = this.currentOffer;
      }
    }

    // Update patience:
    // Decreases on repeated asks with no evidence, or rude tone
    if (!parsedEvon.farmerRespectful) {
      this.patience = Math.max(0, this.patience - 2);
    } else if (!parsedEvon.farmerEvidence && detectedAsk === this.farmerLastAsk && this.round > 2) {
      this.patience = Math.max(0, this.patience - 1);
    } else if (parsedEvon.farmerChallengedTrick) {
      // Good counter raises patience slightly
      this.patience = Math.min(5, this.patience + 1);
    }

    // Track tricks
    if (parsedEvon.trick && parsedEvon.trick !== 'none') {
      const tId = parsedEvon.trick as TrickId;
      if (!this.tricksUsed.includes(tId)) {
        this.tricksUsed.push(tId);
      }
    }
    if (parsedEvon.farmerChallengedTrick && this.tricksUsed.length > 0) {
      const lastTrick = this.tricksUsed[this.tricksUsed.length - 1];
      if (!this.tricksChallenged.includes(lastTrick)) {
        this.tricksChallenged.push(lastTrick);
      }
    }

    // Deal detection:
    // 1. Farmer explicitly accepted, OR
    // 2. Farmer ask is within 2% of current offer, OR
    // 3. Evon flagged deal accepted and offer reached within 3% of ask
    const gapPercent = detectedAsk ? Math.abs(detectedAsk - finalOffer) / finalOffer : 1.0;
    if (isFarmerAccepting || gapPercent <= 0.02 || parsedEvon.dealAccepted) {
      this.isDeal = true;
      parsedEvon.mood = 'deal';
      parsedEvon.line = `Pakka! ₹${finalOffer}/kg par sauda pakka hua. Maal kante par lagao!`;
    }

    // Check walkaway
    if (this.patience <= 0 || (this.round >= this.maxRounds && !this.isDeal)) {
      this.isWalkaway = true;
      parsedEvon.mood = 'irritated';
      if (!this.isDeal) {
        parsedEvon.line = `Bhai ab baat nahi banegi. Mera aakhri daam ₹${finalOffer} tha. Agli baar dekhna.`;
      }
    }

    this.currentOffer = finalOffer;

    const totalTurnTimeMs =
      telemetryStt.latencyMs + evonLatencyMs + timbreData.latencyMs;

    const telemetry: TurnTelemetry = {
      stt: telemetryStt,
      engine: {
        allowedMaxOffer: allowedMax,
        evonProposed: parsedEvon.offer,
        finalOffer: finalOffer,
        clamped,
        clampReason,
      },
      evon: {
        provider: evonProvider,
        zodValid,
        retries: zodValid ? 0 : 1,
        latencyMs: evonLatencyMs,
      },
      timbre: timbreData,
      totalTurnTimeMs,
    };

    const turn: Turn = {
      round: this.round,
      farmerText: sanitizedFarmerText,
      farmerEvidence: parsedEvon.farmerEvidence,
      farmerChallengedTrick: parsedEvon.farmerChallengedTrick,
      farmerRespectful: parsedEvon.farmerRespectful,
      traderOffer: finalOffer,
      traderMood: parsedEvon.mood,
      traderTrick: parsedEvon.trick !== 'none' ? (parsedEvon.trick as TrickId) : undefined,
      traderLine: parsedEvon.line,
      clamped,
      evonProposedOffer: parsedEvon.offer,
      allowedMaxOffer: allowedMax,
      telemetry,
    };

    this.history.push(turn);
    return turn;
  }

  private getDefaultFallbackLine(offer: number): string {
    const isChilli = this.crop.id === 'chilli';
    if (isChilli) {
      return `Dekho bhaiya, teja ka aamad zyada hai, ₹${offer} se ek rupaya upar nahi jaunga.`;
    }
    return `Tamatar jaldi kharab hota hai bhai. ₹${offer} se upar koi nahi dega.`;
  }
}
