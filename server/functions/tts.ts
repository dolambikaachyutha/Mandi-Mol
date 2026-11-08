import type { Handler } from './types';
import { callTimbreTts, getGnaniConfig, isSpeechConfigured } from './_gnani';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// In-memory cache for synthesized trader lines (repeats are common across rounds).
const ttsCache = new Map<string, { audioBase64: string; mime: string; chars: number; model: string }>();

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      text,
      voiceCode,
      languageCode,
    }: { text?: string; voiceCode?: string; languageCode?: string } = JSON.parse(event.body || '{}');

    if (!text) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_TEXT', message: 'Text required for TTS' }),
      };
    }

    const config = getGnaniConfig();
    const voice = voiceCode || config.ttsVoices.hinglish;
    const language = languageCode || 'hi-en';

    const cacheKey = `${config.ttsModel}|${voice}|${language}|${text.trim().toLowerCase()}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...cached, latencyMs: 8, cacheHit: true, fallbackUsed: false }),
      };
    }

    if (!isSpeechConfigured()) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          audioBase64: '',
          mime: '',
          chars: 0,
          latencyMs: 0,
          cacheHit: false,
          fallbackUsed: true,
          notice: 'GNANI_NOT_CONFIGURED: subtitles only',
        }),
      };
    }

    const result = await callTimbreTts(text, voice, language);

    if (text.length < 240 && result.audioBase64) {
      ttsCache.set(cacheKey, {
        audioBase64: result.audioBase64,
        mime: result.mime,
        chars: result.chars,
        model: result.model,
      });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ...result, cacheHit: false, fallbackUsed: false }),
    };
  } catch (err) {
    const message = (err as Error).message || 'TTS failure';
    // Graceful degradation: the round continues with typewriter subtitles.
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        audioBase64: '',
        mime: '',
        chars: 0,
        latencyMs: 0,
        cacheHit: false,
        fallbackUsed: true,
        notice: 'TIMBRE_DEGRADED: subtitles active',
        error: message,
      }),
    };
  }
};
