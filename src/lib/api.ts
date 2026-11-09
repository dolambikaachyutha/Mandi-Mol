import {
  CoachFeedback,
  Difficulty,
  MonthlyImpactSummary,
  PriceAlert,
  PricesApiResponse,
  ProviderHealth,
  RealDeal,
  SellPlanResponse,
  TrickId,
} from '../types';

export interface TraderTurnRequest {
  farmerSpeech: string;
  cropName: string;
  cropVariety: string;
  currentOffer: number;
  allowedMaxOffer: number;
  round: number;
  maxRounds: number;
  difficulty: Difficulty;
  patience: number;
  languageName: string;
  languageCode?: string;
  historySummary?: string;
  usedTricks?: TrickId[];
  farmerTerms?: string;
  traderTerms?: string;
}

export interface TraderTurnResponse {
  offer: number;
  trick: TrickId | 'none';
  mood: 'idle' | 'talking' | 'irritated' | 'impressed' | 'deal';
  line: string;
  farmerEvidence: boolean;
  farmerChallengedTrick: boolean;
  farmerRespectful: boolean;
  dealAccepted: boolean;
  provider?: 'evon' | 'engine';
  note?: string;
  rawResponse?: string;
  latencyMs: number;
}

export interface SttResponse {
  text: string;
  language: string;
  confidence: number;
  latencyMs: number;
  model?: string;
  mockUsed?: boolean;
}

export interface TtsResponse {
  audioBase64: string;
  mime: string;
  chars: number;
  latencyMs: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  notice?: string;
}

// Convert Blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const isMockForced = import.meta.env.VITE_MOCK === 'true';

async function postJson(url: string, payload: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  const responseBody = await res.text();
  if (!contentType.includes('application/json')) {
    const detail = responseBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
    throw new Error(
      `${url} returned a non-JSON response (HTTP ${res.status})${detail ? `: ${detail}` : '.'}`
    );
  }

  const json = JSON.parse(responseBody) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}: ${String(json.message || json.error || 'request failed')}`);
  }
  return json;
}

export async function checkProviderHealth(): Promise<ProviderHealth> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
      throw new Error(`health HTTP ${res.status}`);
    }
    const json = (await res.json()) as Record<string, unknown>;

    const readProvider = (key: 'prisma' | 'evon' | 'timbre') => {
      const entry = (json[key] || {}) as {
        ok?: boolean;
        latencyMs?: number;
        mode?: ProviderHealth['prisma']['mode'];
      };
      return {
        ok: entry.ok ?? false,
        latencyMs: entry.latencyMs ?? 0,
        mode: isMockForced ? ('mock' as const) : entry.mode ?? ('mock' as const),
      };
    };

    return {
      prisma: readProvider('prisma'),
      evon: readProvider('evon'),
      timbre: readProvider('timbre'),
    };
  } catch (error) {
    console.warn('[api] Provider health unavailable:', error);
  }

  return {
    prisma: { ok: false, latencyMs: 0, mode: 'mock' },
    evon: { ok: false, latencyMs: 0, mode: 'engine' },
    timbre: { ok: false, latencyMs: 0, mode: 'mock' },
  };
}

export async function transcribeAudio(
  blob: Blob,
  mimeType: string,
  languageCode: string,
  format: 'transcribe' | 'transliterate' | 'codemix' = 'transcribe'
): Promise<SttResponse> {
  const start = Date.now();

  if (isMockForced) {
    throw new Error('Voice transcription is disabled because VITE_MOCK=true.');
  }

  const normalizedMimeType = mimeType.split(';')[0].trim().toLowerCase();
  const supportedMimeTypes = new Set([
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
  ]);
  if (!supportedMimeTypes.has(normalizedMimeType)) {
    throw new Error(`Unsupported recording format (${mimeType || 'unknown'}). Please record again or use text input.`);
  }

  const base64 = await blobToBase64(blob);
  const json = await postJson('/api/stt', {
    audioBase64: base64,
    mimeType,
    languageCode,
    format,
  });

  return {
    text: String(json.text ?? ''),
    language: String(json.language ?? languageCode),
    confidence: typeof json.confidence === 'number' ? json.confidence : 1,
    latencyMs: typeof json.latencyMs === 'number' ? json.latencyMs : Date.now() - start,
    model: typeof json.model === 'string' ? json.model : undefined,
    mockUsed: false,
  };
}

export async function synthesizeSpeech(
  text: string,
  voiceCode: string,
  languageCode: string
): Promise<TtsResponse> {
  const start = Date.now();

  if (!isMockForced) {
    try {
      const json = await postJson('/api/tts', { text, voiceCode, languageCode });
      const mime = String(json.mime || 'audio/mpeg').split(';')[0];

      return {
        audioBase64: String(json.audioBase64 || ''),
        mime,
        chars: typeof json.chars === 'number' ? json.chars : text.length,
        latencyMs: typeof json.latencyMs === 'number' ? json.latencyMs : Date.now() - start,
        cacheHit: Boolean(json.cacheHit),
        fallbackUsed: Boolean(json.fallbackUsed) || !json.audioBase64,
        notice: typeof json.notice === 'string' ? json.notice : undefined,
      };
    } catch (error) {
      console.warn('[api] Timbre TTS failed, continuing with subtitles:', error);
    }
  }

  await new Promise((r) => setTimeout(r, 200));
  return {
    audioBase64: '',
    mime: 'audio/mpeg',
    chars: text.length,
    latencyMs: Date.now() - start,
    cacheHit: false,
    fallbackUsed: true,
    notice: 'Subtitles active (Timbre audio unavailable)',
  };
}

export async function requestTraderTurn(payload: TraderTurnRequest): Promise<TraderTurnResponse> {
  const start = Date.now();

  if (!isMockForced) {
    try {
      const json = await postJson('/api/trader', payload);
      const offer = Number(json.offer);

      if (Number.isFinite(offer) && typeof json.line === 'string') {
        return {
          offer,
          trick: (json.trick as TrickId | 'none') || 'none',
          mood: (json.mood as TraderTurnResponse['mood']) || 'talking',
          line: json.line,
          farmerEvidence: Boolean(json.farmerEvidence),
          farmerChallengedTrick: Boolean(json.farmerChallengedTrick),
          farmerRespectful: json.farmerRespectful !== false,
          dealAccepted: Boolean(json.dealAccepted),
          provider: json.provider === 'evon' ? 'evon' : 'engine',
          note: typeof json.note === 'string' ? json.note : undefined,
          rawResponse: typeof json.rawResponse === 'string' ? json.rawResponse : undefined,
          latencyMs: typeof json.latencyMs === 'number' ? json.latencyMs : Date.now() - start,
        };
      }
    } catch (error) {
      console.warn('[api] Trader turn failed, using local fallback:', error);
    }
  }

  // Deterministic local response (offline / VITE_MOCK)
  await new Promise((r) => setTimeout(r, 300));
  const hasEvidence =
    /warangal|188|sample|grade|mandi|e-nam|agmark/i.test(payload.farmerSpeech) ||
    payload.farmerSpeech.length > 30;

  const step = hasEvidence ? 6 : 2;
  const proposed = Math.min(payload.allowedMaxOffer, payload.currentOffer + step);

  let trick: TrickId | 'none' = 'quality_nitpick';
  if (payload.round === 2) trick = 'false_market_drop';
  else if (payload.round === 3) trick = 'delayed_payment';
  else if (payload.round >= 4) trick = 'none';

  const fallbackLines: Record<string, string> = {
    english: `For this ${payload.cropName || 'crop'}, I can offer ₹${proposed}/kg. Let's keep the discussion fair.`,
    hindi: `इस ${payload.cropName || 'फसल'} के लिए ₹${proposed}/किलो दे सकता हूँ। बात ठीक से करते हैं।`,
    telugu: `${payload.cropName || 'ఈ పంట'}కు కిలోకు ₹${proposed} ఇవ్వగలను. న్యాయంగా మాట్లాడుకుందాం.`,
    hinglish: `Dekho bhai, ${payload.cropName || 'maal'} ke liye ₹${proposed}/kg de sakta hoon. Baat theek se karte hain.`,
  };

  return {
    offer: proposed,
    trick,
    mood: proposed >= payload.allowedMaxOffer ? 'impressed' : 'talking',
    line: fallbackLines[payload.languageCode || 'hinglish'] || fallbackLines.hinglish,
    farmerEvidence: hasEvidence,
    farmerChallengedTrick: payload.round > 1 && hasEvidence,
    farmerRespectful: true,
    dealAccepted: false,
    provider: 'engine',
    latencyMs: Date.now() - start,
  };
}

export async function requestCoachScorecard(payload: {
  cropName: string;
  finalPrice: number;
  reservePrice: number;
  quantityKg: number;
  turnsSummary: string;
}): Promise<CoachFeedback> {
  if (!isMockForced) {
    try {
      const json = await postJson('/api/coach', payload);
      return {
        wentWell: Array.isArray(json.wentWell) ? (json.wentWell as string[]) : [],
        missed: Array.isArray(json.missed) ? (json.missed as string[]) : [],
        betterLines: Array.isArray(json.betterLines)
          ? (json.betterLines as CoachFeedback['betterLines'])
          : [],
        tone: typeof json.tone === 'string' ? json.tone : 'Firm and respectful',
      };
    } catch (error) {
      console.warn('[api] Coach scorecard failed, using local fallback:', error);
    }
  }

  return {
    wentWell: [
      'Stood ground after the initial lowball offer instead of caving in immediately.',
      'Anchored with market benchmark rates during the crucial middle rounds.',
    ],
    missed: [
      'Accepted the moisture deduction claim without challenging scale tare rules.',
      `Left margin on the table because the trader could stretch to ₹${payload.reservePrice}/kg.`,
    ],
    betterLines: [
      {
        original: 'Bhaiya thoda rate badhao na',
        better:
          'Lalaji, Warangal yard mein Teja dry ₹188 chal raha hai. Uniform dry quality hai, ₹186 se kam nahi banta.',
        why: 'Quoting a verified yard rate forces the trader to defend their margin rather than questioning your quality.',
      },
      {
        original: 'Chalo jo dena hai de do',
        better:
          'Kanta APMC certified par hi hoga aur bhugtan aaj sham RTGS se. Udhari par maal nahi utrega.',
        why: 'Protects working capital and prevents hidden post-bargaining deductions.',
      },
    ],
    tone: 'Respectful, data-driven, and clear on commercial terms.',
  };
}

// ============================================================================
// MODULE 1: LIVE MANDI PRICES & VOICE SEARCH API
// ============================================================================

export async function fetchMandiPrices(params?: {
  state?: string;
  district?: string;
  mandi?: string;
  cropId?: string;
}): Promise<PricesApiResponse> {
  const query = new URLSearchParams();
  if (params?.state) query.set('state', params.state);
  if (params?.district) query.set('district', params.district);
  if (params?.mandi) query.set('mandi', params.mandi);
  if (params?.cropId) query.set('cropId', params.cropId);

  const res = await fetch(`/api/prices?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch mandi prices: HTTP ${res.status}`);
  }
  return res.json();
}

export async function queryMandiVoice(payload: {
  audioBase64?: string;
  queryText?: string;
  mandiLocation?: string;
  languageCode?: string;
}): Promise<{
  recognizedQuery: string;
  mandiLocation: string;
  audioReplyBase64?: string;
  ttsAvailable: boolean;
  data: {
    crop: string;
    modalPricePerKg: number;
    modalPriceQuintal: number;
    minPricePerKg: number;
    maxPricePerKg: number;
    arrivalDate: string;
    source: string;
    spokenAnswer: string;
  };
}> {
  const json = await postJson('/api/voiceQuery', payload);
  return json as unknown as {
    recognizedQuery: string;
    mandiLocation: string;
    audioReplyBase64?: string;
    ttsAvailable: boolean;
    data: {
      crop: string;
      modalPricePerKg: number;
      modalPriceQuintal: number;
      minPricePerKg: number;
      maxPricePerKg: number;
      arrivalDate: string;
      source: string;
      spokenAnswer: string;
    };
  };
}

// ============================================================================
// MODULE 2: SELL PLANNER API
// ============================================================================

export async function fetchSellPlan(params: {
  cropId: string;
  quantityKg: number;
  grade?: string;
  transportCostPerQuintal?: number;
  mandiFeePct?: number;
  hamaliPerBag?: number;
}): Promise<SellPlanResponse> {
  const json = await postJson('/api/planner', params);
  return json as unknown as SellPlanResponse;
}

// ============================================================================
// MODULE 4: REAL DEAL LEDGER & SAUDA SLIP API
// ============================================================================

export async function fetchUserDeals(userId: string): Promise<{
  deals: RealDeal[];
  summary: MonthlyImpactSummary;
  totalDeals: number;
}> {
  const res = await fetch(`/api/deals?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch user deals: HTTP ${res.status}`);
  }
  return res.json();
}

export async function recordRealDeal(dealData: {
  userId: string;
  cropId: string;
  mandiLocation: string;
  quantityKg: number;
  pricePerKg: number;
  buyerSellerName?: string;
  paymentMode?: string;
  dealType?: 'sold' | 'bought';
  notes?: string;
  date?: string;
}): Promise<{
  success: boolean;
  deal: RealDeal;
  summary: MonthlyImpactSummary;
  receipt: {
    receiptNo: string;
    dealId: string;
    date: string;
    crop: string;
    mandi: string;
    party: string;
    role: string;
    quantityKg: number;
    quantityQuintal: number;
    ratePerKg: number;
    ratePerQuintal: number;
    grossTotalRs: number;
    paymentMode: string;
    diffVsMarketTotalRs: number;
    disputeProofNotice: string;
  };
}> {
  const json = await postJson('/api/deals', dealData);
  return json as unknown as {
    success: boolean;
    deal: RealDeal;
    summary: MonthlyImpactSummary;
    receipt: {
      receiptNo: string;
      dealId: string;
      date: string;
      crop: string;
      mandi: string;
      party: string;
      role: string;
      quantityKg: number;
      quantityQuintal: number;
      ratePerKg: number;
      ratePerQuintal: number;
      grossTotalRs: number;
      paymentMode: string;
      diffVsMarketTotalRs: number;
      disputeProofNotice: string;
    };
  };
}

// ============================================================================
// MODULE 1: PRICE ALERTS API
// ============================================================================

export async function fetchUserAlerts(userId: string): Promise<{
  alerts: PriceAlert[];
  totalAlerts: number;
}> {
  const res = await fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: HTTP ${res.status}`);
  }
  return res.json();
}

export async function createPriceAlert(alertData: {
  userId: string;
  cropId: string;
  mandiLocation: string;
  targetPricePerKg: number;
  condition: 'above' | 'below';
  channel?: 'push' | 'whatsapp';
  phone?: string;
}): Promise<{
  success: boolean;
  alert: PriceAlert;
  currentModalPricePerKg: number;
  status: string;
  message: string;
}> {
  const json = await postJson('/api/alerts', alertData);
  return json as unknown as {
    success: boolean;
    alert: PriceAlert;
    currentModalPricePerKg: number;
    status: string;
    message: string;
  };
}

// ============================================================================
// MODULE 4: FPO ANALYTICS API (Min 5 Users DPDP Standard)
// ============================================================================

export async function fetchFpoAnalytics(): Promise<{
  privacyStandard: string;
  totalAggregatedGroups: number;
  redactedDueToPrivacyThreshold: number;
  groups: Array<{
    cropId: string;
    mandiLocation: string;
    totalUsers: number;
    totalSessions: number;
    avgPremiumVsMarketRsPerKg: number;
    totalVolumeTradedRs: number;
    tricksVulnerability: Record<string, number>;
  }>;
  commonMandiTricksAggregate: Array<{
    trick: string;
    failureRatePct: number;
    counterTip: string;
  }>;
}> {
  const res = await fetch('/api/fpo-dashboard');
  if (!res.ok) {
    throw new Error(`Failed to fetch FPO analytics: HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================================
// DPDP PRIVACY: CASCADE DELETE USER DATA
// ============================================================================

export async function deleteUserData(userId: string): Promise<{
  purgedUserId: string;
  deletedDealsCount: number;
  deletedSessionsCount: number;
  deletedAlertsCount: number;
}> {
  const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete profile: HTTP ${res.status}`);
  }
  return res.json();
}

