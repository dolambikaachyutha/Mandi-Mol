import type { Handler } from './types';
import { repository } from '../db/repository';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300', // 5-minute CDN cache
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const commodity = event.queryStringParameters?.commodity;
  const state = event.queryStringParameters?.state;
  const district = event.queryStringParameters?.district;
  const userMandi = event.queryStringParameters?.mandi || 'Warangal APMC Yard';

  // 1. Ingest/Query prices from repository (Agmarknet cache)
  const rows = await repository.getMandiPrices(commodity, state, district);

  // 2. Identify user's mandi row if present
  const userMandiRow = rows.find((r) => r.market.toLowerCase().includes(userMandi.toLowerCase())) || rows[0];

  // 3. Compare with nearby mandis
  const nearbyMandis = rows.map((r) => {
    let priceDiffPct = 0;
    if (userMandiRow && userMandiRow.modal_price > 0) {
      priceDiffPct = Math.round(((r.modal_price - userMandiRow.modal_price) / userMandiRow.modal_price) * 1000) / 10;
    }

    return {
      ...r,
      priceDiffPct,
      diffHeadline: priceDiffPct > 0 
        ? `${r.market} is paying +${priceDiffPct}% more than your mandi today.`
        : priceDiffPct < 0
        ? `${r.market} is paying ${priceDiffPct}% lower than your mandi.`
        : 'Identical to your primary mandi rate.',
    };
  });

  // Sort nearby mandis so best paying market is on top
  nearbyMandis.sort((a, b) => b.modal_price - a.modal_price);
  const bestMandiToday = nearbyMandis[0];

  const plainInsight = bestMandiToday && userMandiRow && bestMandiToday.market !== userMandiRow.market
    ? `${bestMandiToday.market} is currently the highest paying yard at ₹${bestMandiToday.modal_price_kg}/kg (+₹${bestMandiToday.modal_price_kg - userMandiRow.modal_price_kg}/kg above ${userMandiRow.market}).`
    : userMandiRow
    ? `${userMandiRow.market} offers the strongest modal price in your district today at ₹${userMandiRow.modal_price_kg}/kg.`
    : 'No current arrival reports for this commodity.';

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      commodity: commodity || 'all',
      primaryMandi: userMandiRow || null,
      bestMandiToday: bestMandiToday || null,
      plainInsight,
      source: 'Agmarknet (Directorate of Marketing & Inspection, Ministry of Agriculture)',
      lastUpdated: new Date().toISOString(),
      disclaimer: 'Wholesale auction benchmark data for information only. Not financial or trading advice.',
      markets: nearbyMandis,
    }),
  };
};

