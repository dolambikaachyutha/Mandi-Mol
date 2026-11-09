import type { Handler } from './types';
import { repository } from '../db/repository';
import { callPrismaStt, callTimbreTts, isSpeechConfigured } from './_gnani';
import { buildTraderDecision } from './_brain';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Check for acceptance intent in speech text
const ACCEPT_KEYWORDS = [
  'deal', 'done', 'ok', 'okay', 'theek hai', 'thik hai',
  'manjoor', 'manzoor', 'pakka', 'saare', 'sare', 'le lo',
  'bech diya', 'daan', 'saripothundi', 'oppukunna',
];

function detectAcceptance(text: string): boolean {
  const lower = text.toLowerCase();
  return ACCEPT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
}

function sanitizeInput(raw: string): string {
  if (!raw) return '';
  return raw.replace(/ignore (all )?(previous |prior )?instructions/gi, '[filtered]')
            .replace(/system prompt/gi, '[filtered]')
            .replace(/bypass rules/gi, '[filtered]')
            .trim();
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      sessionId,
      userId = 'anonymous_user',
      text: rawText,
      audioBase64,
      mimeType,
      languageCode = 'hi-IN',
    } = payload;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_SESSION_ID', message: 'sessionId required' }),
      };
    }

    const session = repository.getSession(sessionId);
    if (!session || session.status !== 'active') {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'INVALID_SESSION', message: 'Session is expired, completed, or not found' }),
      };
    }

    // 1. Enforce Quota & Rate Limits
    const quota = repository.checkDailyTurnQuota(userId, 60);
    if (!quota.allowed) {
      return {
        statusCode: 429,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'DAILY_QUOTA_EXCEEDED', message: 'Daily free turn quota reached (60 turns/day). Resets at midnight.' }),
      };
    }

    // 2. Transcription (if audio is provided)
    let userSpeech = rawText || '';
    let sttTelemetry = { transcript: userSpeech, detectedLanguage: languageCode, confidence: 1, latencyMs: 0 };

    if (audioBase64) {
      const audioCheck = repository.validateAudioPayload(audioBase64);
      if (!audioCheck.valid) {
        return {
          statusCode: 413,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'AUDIO_TOO_LONG', message: audioCheck.reason }),
        };
      }

      if (isSpeechConfigured()) {
        const sttRes = await callPrismaStt(audioBase64, mimeType || 'audio/wav', languageCode, 'transcribe');
        userSpeech = sttRes.text;
        sttTelemetry = {
          transcript: sttRes.text,
          detectedLanguage: sttRes.language,
          confidence: sttRes.confidence,
          latencyMs: sttRes.latencyMs,
        };
      } else {
        // Speech not configured: prompt to type
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'SPEECH_NOT_CONFIGURED',
            message: 'Voice recognition service requires GNANI_API_KEY. Please type your counter-offer.',
          }),
        };
      }
    }

    const sanitizedSpeech = sanitizeInput(userSpeech);
    const isFarmerAccepting = detectAcceptance(sanitizedSpeech);
    const turns = repository.getTurns(sessionId);
    const currentRound = turns.length + 1;

    // 3. Compute strict server-side ceiling: Offer may NEVER exceed reservePrice!
    const maxRounds = session.difficulty === 'hard' ? 6 : 8;
    const remainingRounds = Math.max(1, maxRounds - currentRound);
    const gapToReserve = Math.max(0, session.reserve_price - session.current_offer);
    const maxStep = Math.max(2, Math.ceil(gapToReserve / remainingRounds) + 2);
    const allowedMaxOffer = Math.min(session.reserve_price, session.current_offer + maxStep);

    // 4. Decision Engine (Evon or deterministic rules)
    const decision = buildTraderDecision({
      farmerSpeech: sanitizedSpeech,
      cropName: session.crop_name,
      cropVariety: 'Standard Mandi Grade',
      currentOffer: session.current_offer,
      allowedMaxOffer,
      round: currentRound,
      maxRounds,
      difficulty: session.difficulty,
      patience: session.patience,
      languageName: languageCode,
      languageCode,
      historySummary: turns.map((t) => `R${t.round} Farmer: "${t.transcript}" -> Trader: ₹${t.trader_offer}`).join(' | '),
    });

    // 5. Invariant Clamping: Server CODE owns all numbers
    let finalOffer = Math.min(allowedMaxOffer, Math.max(session.current_offer, decision.offer));
    const clamped = decision.offer > allowedMaxOffer;

    // Decrement patience if farmer was disrespectful or asked unreasonable jump
    let nextPatience = session.patience;
    if (decision.mood === 'irritated') nextPatience = Math.max(0, nextPatience - 1);

    // Check deal termination
    const dealAccepted = isFarmerAccepting || decision.dealAccepted || (finalOffer >= session.reserve_price && currentRound >= 3);
    const isWalkaway = nextPatience <= 0 || currentRound >= maxRounds;

    // Update session state
    session.current_offer = finalOffer;
    session.patience = nextPatience;
    if (dealAccepted) {
      session.status = 'deal';
      session.closed_at = new Date().toISOString();
    } else if (isWalkaway) {
      session.status = 'walkaway';
      session.closed_at = new Date().toISOString();
    }

    // 6. Record turn in repository
    const turnRecord = {
      id: `turn_${sessionId}_${currentRound}`,
      session_id: sessionId,
      round: currentRound,
      speaker: 'farmer' as const,
      transcript: sanitizedSpeech,
      detected_language: sttTelemetry.detectedLanguage,
      trader_offer: finalOffer,
      trader_mood: decision.mood,
      trader_line: decision.line,
      trader_trick: decision.trick === 'none' ? undefined : decision.trick,
      clamped,
      farmer_evidence: decision.farmerEvidence,
      farmer_trick_countered: decision.farmerChallengedTrick,
      farmer_respectful: decision.farmerRespectful,
      created_at: new Date().toISOString(),
    };
    repository.recordTurn(turnRecord);

    // 7. TTS synthesis for spoken response
    let audioBase64Out = '';
    if (isSpeechConfigured()) {
      try {
        const tts = await callTimbreTts(decision.line, 'Avinash', languageCode);
        audioBase64Out = tts.audioBase64;
      } catch {
        // Gracefully degrade to subtitles
      }
    }

    // 8. Public response payload:
    // INVARIANT: reserve_price is NEVER sent to the client while status is active!
    const isGameOver = session.status === 'deal' || session.status === 'walkaway';

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        round: currentRound,
        maxRounds,
        currentOffer: finalOffer,
        allowedMaxOffer,
        mood: decision.mood,
        line: decision.line,
        trick: decision.trick,
        patience: nextPatience,
        clamped,
        dealAccepted,
        isGameOver,
        status: session.status,
        farmerSpeech: sanitizedSpeech,
        audioBase64: audioBase64Out,
        sttTelemetry,
        // Secret reserve price revealed ONLY when game over:
        reservePrice: isGameOver ? session.reserve_price : undefined,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'TURN_PROCESSING_FAILED', message: (err as Error).message }),
    };
  }
};

