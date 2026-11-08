import { Handler } from './types';
import { callPrismaStt, isSpeechConfigured } from './_gnani';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

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

  if (!isSpeechConfigured()) {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'GNANI_NOT_CONFIGURED',
        message: 'GNANI_API_KEY is missing on the server. Add it to .env and restart the dev server.',
      }),
    };
  }

  try {
    const {
      audioBase64,
      mimeType,
      languageCode,
      format,
    }: {
      audioBase64?: string;
      mimeType?: string;
      languageCode?: string;
      format?: 'transcribe' | 'transliterate' | 'codemix';
    } = JSON.parse(event.body || '{}');

    if (!audioBase64) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_AUDIO', message: 'Audio payload required' }),
      };
    }

    const result = await callPrismaStt(
      audioBase64,
      mimeType || 'audio/wav',
      languageCode || 'hi-IN',
      format || 'transcribe'
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ...result, provider: 'prisma' }),
    };
  } catch (err) {
    const message = (err as Error).message || 'STT failure';
    const unsupported = message.startsWith('UNSUPPORTED_AUDIO_FORMAT');
    return {
      statusCode: unsupported ? 415 : 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'PRISMA_STT_ERROR', message }),
    };
  }
};
