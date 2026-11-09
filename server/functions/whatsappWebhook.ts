import type { Handler } from './types';
import { repository } from '../db/repository';
import { callPrismaStt, callTimbreTts, callEvonInference, isSpeechConfigured } from './_gnani';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Meta WhatsApp Cloud API Webhook Handler
// Feature flag: ENABLE_WHATSAPP_GATEWAY=true
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const isEnabled = process.env.ENABLE_WHATSAPP_GATEWAY === 'true';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mandi_mol_whatsapp_verify_token_2026';

  // 1. Webhook Verification (GET from Meta Developers Console)
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[whatsapp-webhook] Verification successful');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge || '',
      };
    }

    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'VERIFICATION_FAILED', message: 'Invalid verify token or mode' }),
    };
  }

  // 2. Incoming Notification (POST)
  if (event.httpMethod === 'POST') {
    if (!isEnabled) {
      return {
        statusCode: 200, // Return 200 to acknowledge Meta even when gateway feature flag is inactive
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'DISABLED',
          message: 'WhatsApp Gateway is inactive. Set ENABLE_WHATSAPP_GATEWAY=true to enable live messaging.',
        }),
      };
    }

    try {
      const payload = JSON.parse(event.body || '{}');

      // Check if this is an incoming message
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      const fromPhone = message?.from;

      if (!message || !fromPhone) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ status: 'NO_MESSAGE_PAYLOAD' }),
        };
      }

      console.log(`[whatsapp-webhook] Received message type '${message.type}' from ${fromPhone}`);

      let queryText = '';

      // Handle Text message
      if (message.type === 'text') {
        queryText = message.text?.body || '';
      }
      // Handle Audio / Voice Note message
      else if (message.type === 'audio' || message.type === 'voice') {
        // In full production, fetch audio media buffer from Meta Graph API using message.audio.id
        // and WHATSAPP_ACCESS_TOKEN, then convert to base64 for Prisma STT.
        queryText = 'tamatar ka rate kya hai warangal mandi me';
      }

      // Process intent against genuine Agmarknet data
      const chilliRates = repository.getLatestPrices('chilli', 'Warangal APMC Yard');
      const tomatoRates = repository.getLatestPrices('tomato', 'Warangal APMC Yard');
      const rateInfo = queryText.toLowerCase().includes('chilli') || queryText.toLowerCase().includes('mirchi')
        ? chilliRates[0]
        : tomatoRates[0];

      const responseText = rateInfo
        ? `Namaste! Aaj ${rateInfo.market} me ${rateInfo.commodity_name} ka modal bhav ₹${rateInfo.modal_price_kg}/kg (₹${rateInfo.modal_price}/quintal) hai. Min: ₹${rateInfo.min_price_kg}/kg, Max: ₹${rateInfo.max_price_kg}/kg. (Agmarknet certified data). Mandi Mol pe practice karne ke liye https://mandimol.vercel.app kholein!`
        : `Namaste! Mandi Mol me aapka swagat hai. Aaj ke taaza mandi bhav janne ke liye fasal ka naam bhejein, jaise 'tamatar' ya 'mirchi'.`;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'PROCESSED',
          from: fromPhone,
          replyText: responseText,
          channel: 'meta_whatsapp_cloud_api',
        }),
      };
    } catch (err) {
      console.error('[whatsapp-webhook] Error processing webhook:', err);
      return {
        statusCode: 200, // Always 200 for Meta webhook error recovery
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'WEBHOOK_PROCESSING_ERROR' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
