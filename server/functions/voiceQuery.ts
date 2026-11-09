import type { Handler } from './types';
import { repository } from '../db/repository';
import { callPrismaStt, callTimbreTts, isSpeechConfigured } from './_gnani';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Commodity keyword extractor
function extractCommodity(text: string): string {
  const lower = text.toLowerCase();
  if (/mirch|chilli|teja|chilly/i.test(lower)) return 'chilli';
  if (/tamatar|tomato/i.test(lower)) return 'tomato';
  if (/gehun|gehu|wheat|sharbati/i.test(lower)) return 'wheat';
  if (/dhan|paddy|rice|chawal/i.test(lower)) return 'paddy';
  if (/pyaz|pyaj|onion/i.test(lower)) return 'onion';
  if (/kapas|cotton|rui/i.test(lower)) return 'cotton';
  if (/aloo|alu|potato/i.test(lower)) return 'potato';
  if (/soyabean|soybean/i.test(lower)) return 'soybean';
  return 'chilli'; // default
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { audioBase64, mimeType = 'audio/wav', text: manualText, languageCode = 'hi-IN' } = JSON.parse(event.body || '{}');

    let transcript = manualText || '';
    if (audioBase64) {
      if (!isSpeechConfigured()) {
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'SPEECH_NOT_CONFIGURED', message: 'GNANI_API_KEY required for voice search.' }),
        };
      }
      const stt = await callPrismaStt(audioBase64, mimeType, languageCode, 'transcribe');
      transcript = stt.text;
    }

    if (!transcript.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'NO_SPEECH', message: 'Could not understand query. Please ask again.' }),
      };
    }

    // 1. Extract commodity from query
    const commodityId = extractCommodity(transcript);

    // 2. Fetch real data from Agmarknet cache (NEVER hallucinated)
    const priceRows = await repository.getMandiPrices(commodityId);
    const primary = priceRows[0];

    if (!primary) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          transcript,
          found: false,
          answer: `Maaf kijiye, aaj ke Agmarknet bulletin mein ${commodityId} ka bhav darj nahi hai.`,
        }),
      };
    }

    // 3. Formulate factual spoken response (strictly bound to repository numbers)
    const spokenText = `Aaj ${primary.market} mein ${primary.commodity_name} ka modal bhav ₹${primary.modal_price_kg} prati kilo yani ₹${primary.modal_price} prati quintal hai. Kam se kam ₹${primary.min_price_kg} aur zyada se zyada ₹${primary.max_price_kg} chal raha hai.`;

    // 4. Synthesize spoken response via Timbre
    let audioBase64Out = '';
    if (isSpeechConfigured()) {
      try {
        const tts = await callTimbreTts(spokenText, 'Avinash', languageCode);
        audioBase64Out = tts.audioBase64;
      } catch {
        // graceful degradation to text
      }
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        transcript,
        found: true,
        commodity: primary.commodity_name,
        market: primary.market,
        modalPriceKg: primary.modal_price_kg,
        modalPriceQuintal: primary.modal_price,
        minPriceKg: primary.min_price_kg,
        maxPriceKg: primary.max_price_kg,
        arrivalDate: primary.arrival_date,
        source: primary.source,
        spokenText,
        audioBase64: audioBase64Out,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'VOICE_QUERY_FAILED', message: (err as Error).message }),
    };
  }
};

