import crypto from 'node:crypto';
import type { Handler } from './types';
import { repository } from '../db/repository';
import type { DealRecord } from '../db/types';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Rate limit
  const clientIp = event.headers['x-forwarded-for'] || 'anonymous';
  const rateLimit = repository.checkRateLimit(`deals_${clientIp}`, 60, 60000);
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many deal ledger requests. Please slow down.',
      }),
    };
  }

  // GET: Fetch deals and monthly summary
  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.userId || 'anonymous';
    const deals = repository.getUserDeals(userId);
    const summary = repository.getMonthlySummary(userId);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        userId,
        deals,
        summary,
        totalDeals: deals.length,
      }),
    };
  }

  // POST: Record a new real market deal
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const {
        userId = 'anonymous',
        cropId,
        mandiLocation = 'Warangal APMC Yard',
        quantityKg,
        pricePerKg,
        buyerSellerName,
        paymentMode = 'upi',
        dealType = 'sold',
        notes = '',
        date,
      } = payload;

      if (!cropId || !quantityKg || !pricePerKg) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'MISSING_FIELDS',
            message: 'cropId, quantityKg, and pricePerKg are required to record a deal.',
          }),
        };
      }

      const parsedQty = Math.max(0.1, Number(quantityKg));
      const parsedPrice = Math.max(0.1, Number(pricePerKg));

      // Look up official Agmarknet benchmark modal rate for this crop and mandi
      const marketPrices = repository.getLatestPrices(cropId, mandiLocation);
      const benchmarkModalPerKg = marketPrices[0]?.modal_price_kg || (marketPrices[0] as any)?.modal_price_per_kg || parsedPrice;

      const diffPerKg = Math.round((parsedPrice - benchmarkModalPerKg) * 100) / 100;
      const totalDiff = Math.round(diffPerKg * parsedQty);
      const totalGross = Math.round(parsedPrice * parsedQty);

      const dealDate = date || new Date().toISOString().split('T')[0];
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const receiptNo = `SAUDA-${cropId.slice(0, 3).toUpperCase()}-${dealDate.replace(/-/g, '')}-${randomSuffix}`;

      const newDeal: DealRecord = {
        id: `deal_${crypto.randomUUID()}`,
        user_id: userId,
        crop_id: cropId,
        mandi_location: mandiLocation,
        deal_type: dealType,
        quantity_kg: parsedQty,
        agreed_price_per_kg: parsedPrice,
        agmarknet_modal_price_per_kg: benchmarkModalPerKg,
        diff_vs_market_rs_per_kg: diffPerKg,
        total_diff_vs_market_rs: totalDiff,
        total_gross_amount: totalGross,
        buyer_seller_name: buyerSellerName || (dealType === 'sold' ? 'Registered APMC Commission Agent' : 'Local Cultivator'),
        payment_mode: paymentMode,
        deal_date: dealDate,
        notes,
        created_at: new Date().toISOString(),
      };

      repository.createDeal(newDeal);
      const updatedSummary = repository.getMonthlySummary(userId);

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          deal: newDeal,
          summary: updatedSummary,
          receipt: {
            receiptNo,
            dealId: newDeal.id,
            date: dealDate,
            crop: cropId,
            mandi: mandiLocation,
            party: newDeal.buyer_seller_name,
            role: dealType === 'sold' ? 'Buyer (Commission Agent / Trader)' : 'Seller (Farmer / Supplier)',
            quantityKg: parsedQty,
            quantityQuintal: Math.round((parsedQty / 100) * 100) / 100,
            ratePerKg: parsedPrice,
            ratePerQuintal: parsedPrice * 100,
            grossTotalRs: totalGross,
            paymentMode,
            diffVsMarketTotalRs: totalDiff,
            disputeProofNotice: 'Standard APMC Mandi Sauda Slip. Generated for mutual trade record and transparency. Information record only; verify against official APMC weighment slip.',
          },
        }),
      };
    } catch (err) {
      console.error('[deals] Error processing request:', err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'DEALS_ERROR',
          message: err instanceof Error ? err.message : 'Failed to record deal',
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
