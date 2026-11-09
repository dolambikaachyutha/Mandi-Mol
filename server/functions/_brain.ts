/**
 * ============================================================================
 * DETERMINISTIC TRADER BRAIN
 * ============================================================================
 * Lalaji's dialogue and trick selection when the Evon reasoning endpoint is not
 * provisioned for the account. Same contract as the Evon JSON response, but the
 * numbers are produced by fixed, auditable rules instead of a language model.
 * The game engine still clamps every offer afterwards.
 */

export type BrainLanguage = 'hinglish' | 'hindi' | 'telugu' | 'english';

export type TrickId =
  | 'quality_nitpick'
  | 'false_market_drop'
  | 'fake_scarcity'
  | 'weight_cut'
  | 'delayed_payment'
  | 'friendly_pressure';

export interface TraderBrainPayload {
  farmerSpeech: string;
  cropName?: string;
  cropVariety?: string;
  currentOffer: number;
  allowedMaxOffer: number;
  round: number;
  maxRounds: number;
  difficulty: 'easy' | 'hard';
  patience: number;
  languageCode?: string;
  languageName?: string;
  historySummary?: string;
  usedTricks?: string[];
  farmerTerms?: string;
  traderTerms?: string;
}

export interface TraderDecision {
  offer: number;
  trick: TrickId | 'none';
  mood: 'idle' | 'talking' | 'irritated' | 'impressed' | 'deal';
  line: string;
  farmerEvidence: boolean;
  farmerChallengedTrick: boolean;
  farmerRespectful: boolean;
  dealAccepted: boolean;
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const TELUGU_DIGITS = '౦౧౨౩౪౫౬౭౮౯';

function normalizeDigits(text: string): string {
  return text.replace(/[०-९౦-౯]/g, (char) => {
    const dev = DEVANAGARI_DIGITS.indexOf(char);
    if (dev >= 0) return String(dev);
    const tel = TELUGU_DIGITS.indexOf(char);
    if (tel >= 0) return String(tel);
    return char;
  });
}

const DEAL_PATTERN =
  /\b(deal|done|ok|okay|theek hai|thik hai|manzoor|manjoor|pakka|sauda|bech diya|le lo|final kar do|haan bhai)\b|ठीक है|मंजूर|पक्का|सौदा|बेच दिया|ऒప్పుకున్నాను|సరే|బాగుంది|ఒప్పందం/i;

const EVIDENCE_PATTERNS: RegExp[] = [
  /agmarknet|e-?nam|apmc\s*rate|benchmark|एगमार्कनेट|ई-?नाम|बेंचमार्क|అగ్మార్క్|ఈ-?నామ్/i,
  /warangal|khammam|guntur|kurnool|nizamabad|hyderabad|bypass|वारंगल|गुंटूर|खम्मम|వరంగల్|గుంటూరు|ఖమ్మం/i,
  /sample|lab|certificat|grade\s*a|सैंपल|लैब|प्रमाण|శాంపిల్|ప్రమాణ/i,
  /dusra|dusri|alternate|another buyer|patel|sharma|गेट नं|दूसरा|व्यापारी|వేరే|వ్యాపారి/i,
];

const CHALLENGE_PATTERN =
  /katauti|katauti|tare|nami|moisture|godown|udhaar|udhari|cheque|rtgs|cash|nagad|rishta|chai|कटौती|नमी|गोदाम|उधार|चेक|नगद|रिश्ता|చెక్కు|తేమ|గోదాము|అప్పు|నగదు|బంధం/i;

const DISRESPECT_PATTERN =
  /chutiya|bhosdi|madarchod|harami|kamina|kutta|kutte|fuck|stfu|बकवास|चूतिया|कमीना|कुत्ते|దొంగ|మోసగాడు|పిచ్చి/i;

const TRICK_ORDER: TrickId[] = [
  'quality_nitpick',
  'false_market_drop',
  'weight_cut',
  'delayed_payment',
  'fake_scarcity',
  'friendly_pressure',
];

function detectLanguage(payload: TraderBrainPayload): BrainLanguage {
  const code = (payload.languageCode || '').toLowerCase();
  if (code === 'hindi' || code === 'hi' || code.startsWith('hi-')) return 'hindi';
  if (code === 'telugu' || code === 'te' || code.startsWith('te-')) return 'telugu';
  if (code === 'english' || code === 'en' || code.startsWith('en-')) return 'english';
  if (code === 'hinglish') return 'hinglish';

  const name = (payload.languageName || '').toLowerCase();
  if (name.includes('telugu')) return 'telugu';
  if (name.includes('hindi') && !name.includes('hinglish')) return 'hindi';
  if (name.includes('english')) return 'english';

  const speech = payload.farmerSpeech || '';
  if (/[\u0C00-\u0C7F]/.test(speech)) return 'telugu';
  if (/[\u0900-\u097F]/.test(speech)) return 'hindi';
  return 'hinglish';
}

function extractPriceAsk(text: string, currentOffer: number, allowedMax: number): number | null {
  const normalized = normalizeDigits(text);
  const candidates = Array.from(normalized.matchAll(/\b(\d{2,4})\b/g))
    .map((match) => Number(match[1]))
    .filter((value) => value >= 20 && value <= 999);
  if (candidates.length === 0) return null;

  const plausible = candidates.filter(
    (value) => value >= Math.round(currentOffer * 0.7) && value <= Math.round(allowedMax * 1.3)
  );
  const pool = plausible.length > 0 ? plausible : candidates;
  return pool[pool.length - 1];
}

function clampOffer(value: number, floor: number, ceiling: number): number {
  return Math.max(floor, Math.min(Math.round(value), ceiling));
}

function selectTrick(payload: TraderBrainPayload, evidence: boolean, challenged: boolean): TrickId | 'none' {
  if (challenged) return 'none';
  if (evidence) return 'none';

  const used = new Set((payload.usedTricks || []).filter(Boolean));
  const available = TRICK_ORDER.filter((trick) => !used.has(trick));
  if (available.length === 0) return 'none';

  // Rotate the opening trick so repeat sessions do not feel identical.
  const offset = Math.max(0, Number(payload.round) || 0) % available.length;
  return available[offset];
}

interface LineContext {
  offer: number;
  cropName: string;
  language: BrainLanguage;
  evidence: boolean;
  dealAccepted: boolean;
  lastOfferReached: boolean;
}

function buildLine(trick: TrickId | 'none', ctx: LineContext): string {
  const { offer } = ctx;

  const hinglish: Record<TrickId | 'none', string> = {
    quality_nitpick: `Arre bhai, thode daane pile aur sookhe hain. Is quality par ₹${offer} se upar nahi ja sakta.`,
    false_market_drop: `Aaj subah bypass se bees gaadi aayi hai, bhav gir gaya. ₹${offer} par baat karo.`,
    fake_scarcity: `Mera godown pehle se bhara hai. Phir bhi ₹${offer} bol raha hoon, ehsaan samjho.`,
    weight_cut: `Rate ₹${offer} de dunga, lekin chaar kilo per bori nami kategi. Yahi mandi ka dastoor hai.`,
    delayed_payment: `₹${offer} likh dunga, magar bees din baad cheque. Aaj cash chahiye toh kam hoga.`,
    friendly_pressure: `Dus saal ka rishta hai bhai. Chai piyo, ₹${offer} par sauda pakka kar do.`,
    none: ctx.evidence
      ? `Theek hai, tumhari baat mein dum hai. ₹${offer} final, isse ek rupaya upar nahi.`
      : `Dekho bhai, ₹${offer} tak hi aa sakta hoon. Zyada khich-taani mat karo.`,
  };

  const hindi: Record<TrickId | 'none', string> = {
    quality_nitpick: `भाई साहब, कुछ दाने पीले और सूखे हैं। इस क्वालिटी पर ₹${offer} से ऊपर नहीं जा सकता।`,
    false_market_drop: `आज सुबह बाईपास से बीस गाड़ियाँ आई हैं, भाव गिर गया। ₹${offer} पर बात करो।`,
    fake_scarcity: `मेरा गोदाम पहले से भरा है। फिर भी ₹${offer} बोल रहा हूँ, एहसान समझो।`,
    weight_cut: `रेट ₹${offer} दूँगा, लेकिन चार किलो प्रति बोरी नमी कटेगी। यही मंडी का दस्तूर है।`,
    delayed_payment: `₹${offer} लिख दूँगा, पर बीस दिन बाद चेक। आज नगद चाहिए तो कम होगा।`,
    friendly_pressure: `दस साल का रिश्ता है भाई। चाय पियो, ₹${offer} पर सौदा पक्का करो।`,
    none: ctx.evidence
      ? `ठीक है, तुम्हारी बात में दम है। ₹${offer} फाइनल, इससे एक रुपया ऊपर नहीं।`
      : `देखो भाई, ₹${offer} तक ही आ सकता हूँ। ज्यादा खींचतान मत करो।`,
  };

  const telugu: Record<TrickId | 'none', string> = {
    quality_nitpick: `అన్నా, కొన్ని గింజలు పసుపు రంగులో ఉన్నాయి. ఈ క్వాలిటీకి ₹${offer} మించి ఇవ్వలేను.`,
    false_market_drop: `ఈ రోజు ఉదయం ఇరవై లారీలు వచ్చాయి, రేటు పడింది. ₹${offer} కి మాట్లాడండి.`,
    fake_scarcity: `నా గోదాము నిండింది. అయినా ₹${offer} చెబుతున్నాను, దయతో తీసుకోండి.`,
    weight_cut: `రేటు ₹${offer} ఇస్తాను, కానీ బస్తాకు నాలుగు కిలోలు తేమ కోత ఉంటుంది.`,
    delayed_payment: `₹${offer} రాశాను, కానీ ఇరవై రోజుల తర్వాత చెక్కు. నగదు కావాలంటే తక్కువ.`,
    friendly_pressure: `పది సంవత్సరాల సంబంధం. టీ తాగండి, ₹${offer} కి ఒప్పందం చేసుకోండి.`,
    none: ctx.evidence
      ? `సరే, మీ మాటలో బలం ఉంది. ₹${offer} ఫైనల్, ఇంతకు మించి కాదు.`
      : `అన్నా, ₹${offer} వరకే ఇవ్వగలను. ఎక్కువ ఒత్తిడి చేయకండి.`,
  };
  const english: Record<TrickId | 'none', string> = {
    quality_nitpick: `Some produce looks dry or uneven. I cannot offer more than ₹${offer} for this quality.`,
    false_market_drop: `More trucks arrived this morning and prices fell. Let us settle at ₹${offer}.`,
    fake_scarcity: `My warehouse is nearly full. I can still offer ₹${offer} for your lot.`,
    weight_cut: `I can pay ₹${offer}, but I need a moisture deduction. Let us verify the weight together.`,
    delayed_payment: `I can offer ₹${offer} with delayed payment. Immediate payment would mean a lower price.`,
    friendly_pressure: `We have traded for years. Have some tea and let us settle at ₹${offer}.`,
    none: ctx.evidence
      ? `Your evidence makes sense. ₹${offer} is my final offer.`
      : `I can offer ₹${offer}. Let us not stretch the negotiation too far.`,
  };

  if (ctx.dealAccepted) {
    if (ctx.language === 'english') return `Agreed at ₹${offer}. We have a deal.`;
    if (ctx.language === 'telugu') return `సరే, ₹${offer} కి ఒప్పందం. బస్తాలు దించండి.`;
    if (ctx.language === 'hindi') return `ठीक है, ₹${offer} पर सौदा पक्का। बोरियाँ उतारो।`;
    return `Theek hai bhai, ₹${offer} par sauda pakka. Boriyan utaaro.`;
  }

  const table = ctx.language === 'english'
    ? english
    : ctx.language === 'telugu'
      ? telugu
      : ctx.language === 'hindi'
        ? hindi
        : hinglish;
  const line = table[trick];
  void ctx.cropName;
  return line;
}

export function buildTraderDecision(payload: TraderBrainPayload): TraderDecision {
  const language = detectLanguage(payload);
  const speech = normalizeDigits(payload.farmerSpeech || '');
  const currentOffer = Number.isFinite(payload.currentOffer) ? payload.currentOffer : 0;
  const allowedMax = Math.max(currentOffer, Number(payload.allowedMaxOffer) || currentOffer);
  const gap = Math.max(0, allowedMax - currentOffer);
  const round = Number(payload.round) || 1;
  const hardMode = payload.difficulty === 'hard';

  const respectful = !DISRESPECT_PATTERN.test(speech);
  const dealAccepted = respectful && DEAL_PATTERN.test(speech);
  const evidence =
    EVIDENCE_PATTERNS.some((pattern) => pattern.test(speech)) ||
    (() => {
      const ask = extractPriceAsk(speech, currentOffer, allowedMax);
      return ask !== null && ask >= currentOffer + 3;
    })();
  const challenged = CHALLENGE_PATTERN.test(speech);
  const ask = extractPriceAsk(speech, currentOffer, allowedMax);

  let offer = currentOffer;
  if (!respectful) {
    offer = currentOffer; // rude farmers get no movement
  } else if (dealAccepted) {
    offer = clampOffer(ask !== null ? Math.max(currentOffer, ask) : currentOffer, currentOffer, allowedMax);
  } else if (evidence) {
    offer = clampOffer(currentOffer + Math.max(2, Math.round(gap * 0.7)), currentOffer, allowedMax);
  } else if (challenged) {
    offer = clampOffer(currentOffer + Math.max(1, Math.round(gap * 0.4)), currentOffer, allowedMax);
  } else if (hardMode && round > 1) {
    offer = currentOffer;
  } else {
    offer = clampOffer(currentOffer + Math.max(1, Math.round(gap * 0.25)), currentOffer, allowedMax);
  }

  if (ask !== null && ask < currentOffer) {
    offer = currentOffer; // lowball counters do not lower the trader's price
  }

  const trick = respectful ? selectTrick(payload, evidence, challenged) : 'none';
  const patience = Number(payload.patience) || 0;
  const mood: TraderDecision['mood'] = dealAccepted
    ? 'deal'
    : !respectful || patience <= 2
      ? 'irritated'
      : evidence
        ? 'impressed'
        : 'talking';

  return {
    offer,
    trick,
    mood,
    line: buildLine(trick, {
      offer,
      cropName: payload.cropName || 'maal',
      language,
      evidence,
      dealAccepted,
      lastOfferReached: offer >= allowedMax,
    }),
    farmerEvidence: evidence,
    farmerChallengedTrick: challenged,
    farmerRespectful: respectful,
    dealAccepted,
  };
}

// ----------------------------------------------------------------------------
// Deterministic coaching scorecard fallback
// ----------------------------------------------------------------------------

export interface CoachPayload {
  cropName?: string;
  finalPrice: number;
  reservePrice: number;
  quantityKg: number;
  turnsSummary?: string;
}

export function buildCoachFallback(payload: CoachPayload) {
  const crop = payload.cropName || 'your lot';
  const finalPrice = Number(payload.finalPrice) || 0;
  const reservePrice = Number(payload.reservePrice) || finalPrice;
  const quantityKg = Number(payload.quantityKg) || 0;
  const moneyLeft = Math.max(0, (reservePrice - finalPrice) * quantityKg);

  return {
    wentWell: [
      `You kept the conversation on price instead of letting Lalaji settle it in silence, and closed at ₹${finalPrice}/kg for ${quantityKg} kg.`,
      finalPrice >= reservePrice - 2
        ? `You pushed Lalaji right up to his ₹${reservePrice}/kg limit — that is a strong close.`
        : `You did not accept the opening lowball and forced at least one upward revision.`,
    ],
    missed: [
      `₹${moneyLeft.toLocaleString('en-IN')} stayed on the table because the trader could stretch to ₹${reservePrice}/kg.`,
      `Each uncountered objection (quality, moisture, delayed payment) was worth roughly ₹${Math.max(
        1,
        Math.round((reservePrice - finalPrice) / 3)
      )}/kg in leverage.`,
    ],
    betterLines: [
      {
        original: 'Bhaiya thoda rate badhao na',
        better: `${crop} ka aaj ka mandi benchmark ₹${reservePrice}/kg hai. Quality first grade hai, isliye ₹${Math.min(
          reservePrice,
          finalPrice + 4
        )} se kam nahi banta.`,
        why: 'A quoted benchmark plus a specific number forces the trader to argue with evidence, not with your confidence.',
      },
      {
        original: 'Chalo jo dena hai de do',
        better: `Kanta APMC certified par hi hoga aur bhugtan aaj shaam RTGS se. Udhaari par maal nahi utrega.`,
        why: 'Fixing the weighbridge and the payment channel removes the two deductions a trader adds after the rate is agreed.',
      },
    ],
    tone: 'Respectful and firm, with room to use more hard evidence.',
  };
}
