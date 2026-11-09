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

  // GET: Retrieve public session state
  if (event.httpMethod === 'GET') {
    const sessionId = event.queryStringParameters?.sessionId;
    if (!sessionId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_SESSION_ID', message: 'sessionId query parameter required' }),
      };
    }

    const state = repository.getSessionPublicState(sessionId);
    if (!state) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'No active session found with this id' }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ session: state }),
    };
  }

  // POST: Create a new server-authoritative session
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const {
        userId = 'anonymous_user',
        role = 'farmer',
        cropId = 'chilli',
        cropName = 'Teja Chilli (Dry)',
        mandiLocation = 'Warangal APMC Yard',
        quantityKg = 500,
        referencePrice = 185,
        targetPrice,
        walkawayPrice,
        customOpeningOffer,
        customReservePrice,
        difficulty = 'easy',
        traderName = 'Lalaji (Radhe Shyam)',
        traderFirm = 'Gupta Agro Commodities, Yard Shop #14',
        traderStyle = 'fair',
      } = payload;

      // Rate limit session creations
      const rate = repository.checkRateLimit(`session_init_${userId}`, 20, 60000);
      if (!rate.allowed) {
        return {
          statusCode: 429,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many sessions initialized. Please wait a minute.' }),
        };
      }

      const session = repository.createSession({
        userId,
        role: role === 'trader' ? 'trader' : 'farmer',
        cropId,
        cropName,
        mandiLocation,
        quantityKg: Number(quantityKg) || 500,
        referencePrice: Number(referencePrice) || 185,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        walkawayPrice: walkawayPrice ? Number(walkawayPrice) : undefined,
        customOpeningOffer: customOpeningOffer ? Number(customOpeningOffer) : undefined,
        customReservePrice: customReservePrice ? Number(customReservePrice) : undefined,
        difficulty: difficulty === 'hard' ? 'hard' : 'easy',
        traderName,
        traderFirm,
        traderStyle,
      });

      // Return public session state only (NO reserve price!)
      const publicState = repository.getSessionPublicState(session.id);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          sessionId: session.id,
          session: publicState,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'SESSION_INIT_FAILED', message: (err as Error).message }),
      };
    }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};

