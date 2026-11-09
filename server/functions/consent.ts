import type { Handler } from './types';
import { repository } from '../db/repository';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // GET: Check consent status
  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.userId;
    const consentType = event.queryStringParameters?.consentType || 'voice_stt_transcription';
    if (!userId) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'MISSING_USER_ID' }) };
    }

    const has = repository.hasConsent(userId, consentType);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ userId, consentType, granted: has }),
    };
  }

  // POST: Record consent
  if (event.httpMethod === 'POST') {
    try {
      const { userId, consentType = 'voice_stt_transcription' } = JSON.parse(event.body || '{}');
      if (!userId) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'MISSING_USER_ID' }) };
      }

      const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
      const record = repository.recordConsent(userId, consentType, clientIp);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, consent: record }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'CONSENT_FAILED', message: (err as Error).message }),
      };
    }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};

