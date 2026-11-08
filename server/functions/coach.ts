import { Handler } from './types';
import { callEvonInference, isEvonConfigured } from './_gnani';
import { buildCoachFallback, CoachPayload } from './_brain';

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

  try {
    const payload: CoachPayload = JSON.parse(event.body || '{}');
    const fallback = buildCoachFallback(payload);

    if (!isEvonConfigured() || !payload.turnsSummary) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...fallback, provider: 'engine', latencyMs: 0 }),
      };
    }

    const moneyLeft = Math.max(0, (payload.reservePrice - payload.finalPrice) * payload.quantityKg);

    const systemPrompt = `You are an empathetic agricultural economist and mandi negotiation coach.
Review the farmer's negotiation against trader Lalaji.
Crop: ${payload.cropName}, Quantity: ${payload.quantityKg} kg. Final settled price: ₹${payload.finalPrice}/kg. Trader's hidden reserve limit was ₹${payload.reservePrice}/kg.
Money left on the table: ₹${moneyLeft.toLocaleString('en-IN')}.

Provide constructive, concrete, rupee-focused coaching:
1. Two specific things the farmer did well.
2. Two missed opportunities where the farmer gave away leverage or accepted a trader objection too easily.
3. Two "Say This Instead" cards comparing the farmer's actual weak phrase with a punchy, data-backed counter phrase in simple Hinglish, explaining the exact negotiation reason.

Return strictly a JSON object:
{
  "wentWell": ["...", "..."],
  "missed": ["...", "..."],
  "betterLines": [{"original": "...", "better": "...", "why": "..."}],
  "tone": "..."
}`;

    try {
      const { rawText, latencyMs, model } = await callEvonInference(
        systemPrompt,
        `Negotiation turns:\n${payload.turnsSummary}`
      );
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      const wentWell = Array.isArray(parsed.wentWell) ? parsed.wentWell.filter((v): v is string => typeof v === 'string') : [];
      const missed = Array.isArray(parsed.missed) ? parsed.missed.filter((v): v is string => typeof v === 'string') : [];
      const betterLines = Array.isArray(parsed.betterLines)
        ? (parsed.betterLines as Record<string, unknown>[])
            .filter(
              (card) =>
                typeof card.original === 'string' && typeof card.better === 'string' && typeof card.why === 'string'
            )
            .map((card) => ({
              original: card.original as string,
              better: card.better as string,
              why: card.why as string,
            }))
        : [];

      if (wentWell.length === 0 || missed.length === 0 || betterLines.length === 0) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ ...fallback, provider: 'engine', latencyMs }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          wentWell,
          missed,
          betterLines,
          tone: typeof parsed.tone === 'string' ? parsed.tone : fallback.tone,
          provider: 'evon',
          model,
          latencyMs,
        }),
      };
    } catch {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...fallback, provider: 'engine', latencyMs: 0 }),
      };
    }
  } catch (err) {
    const message = (err as Error).message || 'Coach inference error';
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'COACH_ERROR', message }),
    };
  }
};
