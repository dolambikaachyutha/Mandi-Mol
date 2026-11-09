import type { Handler } from './types';
import { repository } from '../db/repository';
import { callPrismaStt, callTimbreTts, isSpeechConfigured } from './_gnani';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Commodity keyword extractor supporting English, Telugu script & Devanagari
function extractCommodity(text: string): string {
  const lower = text.toLowerCase();
  if (/mirch|chilli|teja|chilly|మిర్చి|ఎండుమిర్చి|మిరప|తీపిమిర్చి|मिर्च|तीखी/i.test(lower)) return 'chilli';
  if (/tamatar|tomato|టమోటా|టొమాటో|టమాట|టమాటాలు|टमाटर/i.test(lower)) return 'tomato';
  if (/gehun|gehu|wheat|sharbati|గోధుమ|గోధుమలు|गेहूं|गेहुं/i.test(lower)) return 'wheat';
  if (/dhan|paddy|rice|chawal|వరి|వరిధాన్యం|బియ్యం|ధాన్యం|धान|चावल/i.test(lower)) return 'paddy';
  if (/pyaz|pyaj|onion|ఉల్లి|ఉల్లిపాయ|ఉల్లిగడ్డ|प्याज|कांदा/i.test(lower)) return 'onion';
  if (/kapas|cotton|rui|పత్తి|దూది|कपास|रुई/i.test(lower)) return 'cotton';
  if (/aloo|alu|potato|ఆలూ|బంగాళాదుంప|ఆలుగడ్డ|ఆలూగడ్డ|आलू|बटाटा/i.test(lower)) return 'potato';
  if (/soyabean|soybean|సోయా|సోయాబీన్|सोयाबीन|सोया/i.test(lower)) return 'soybean';
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

    const isTelugu = (typeof languageCode === 'string' && (languageCode.startsWith('te') || languageCode === 'telugu')) || /[\u0C00-\u0C7F]/.test(transcript);
    const isEnglish = typeof languageCode === 'string' && (languageCode.startsWith('en') || languageCode === 'english');

    if (!primary) {
      let notFoundText = `माफ कीजिए, आज के Agmarknet बुलेटिन में ${commodityId} का भाव दर्ज नहीं है।`;
      if (isTelugu) {
        notFoundText = `క్షమించండి, ఈరోజు Agmarknet బులెటిన్‌లో ${commodityId} ధర నమోదు కాలేదు.`;
      } else if (isEnglish) {
        notFoundText = `Sorry, ${commodityId} price is not listed in today's Agmarknet bulletin.`;
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          transcript,
          recognizedQuery: transcript,
          found: false,
          answer: notFoundText,
          spokenText: notFoundText,
          spokenAnswer: notFoundText,
          data: {
            crop: commodityId,
            modalPricePerKg: 0,
            modalPriceQuintal: 0,
            minPricePerKg: 0,
            maxPricePerKg: 0,
            arrivalDate: 'Today',
            source: 'Agmarknet',
            spokenAnswer: notFoundText,
          },
        }),
      };
    }

    // 3. Formulate factual spoken response (strictly bound to repository numbers)
    let spokenText = '';
    if (isTelugu) {
      spokenText = `ఈరోజు ${primary.market}లో ${primary.commodity_name} సగటు ధర కిలోకు ₹${primary.modal_price_kg} (క్వింటాల్‌కు ₹${primary.modal_price}). కనీస ధర ₹${primary.min_price_kg}, గరిష్ట ధర ₹${primary.max_price_kg} పలుకుతోంది.`;
    } else if (isEnglish) {
      spokenText = `Today in ${primary.market}, modal price for ${primary.commodity_name} is ₹${primary.modal_price_kg}/kg (₹${primary.modal_price}/quintal). Range is ₹${primary.min_price_kg} to ₹${primary.max_price_kg}/kg.`;
    } else {
      spokenText = `आज ${primary.market} में ${primary.commodity_name} का मॉडल भाव ₹${primary.modal_price_kg} प्रति किलो यानी ₹${primary.modal_price} प्रति क्विंटल है। न्यूनतम ₹${primary.min_price_kg} और अधिकतम ₹${primary.max_price_kg} चल रहा है।`;
    }

    // 4. Synthesize spoken response via Timbre
    let audioBase64Out = '';
    if (isSpeechConfigured()) {
      try {
        const ttsLang = isTelugu ? 'te-IN' : isEnglish ? 'en-IN' : 'hi-IN';
        const tts = await callTimbreTts(spokenText, 'Avinash', ttsLang);
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
        recognizedQuery: transcript,
        mandiLocation: primary.market,
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
        spokenAnswer: spokenText,
        audioBase64: audioBase64Out,
        audioReplyBase64: audioBase64Out,
        ttsAvailable: !!audioBase64Out,
        data: {
          crop: primary.commodity_name,
          modalPricePerKg: primary.modal_price_kg,
          modalPriceQuintal: primary.modal_price,
          minPricePerKg: primary.min_price_kg,
          maxPricePerKg: primary.max_price_kg,
          arrivalDate: primary.arrival_date,
          source: primary.source,
          spokenAnswer: spokenText,
        },
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

