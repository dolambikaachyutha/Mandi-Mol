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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      cropId = 'chilli',
      quantityKg = 1500, // 15 quintals
      qualityGrade = 'Grade A (Export / Premium Quality)',
      transportCostPerQuintal = 40, // Rs 40/quintal base
      mandiFeePercent = 1.0, // 1% APMC user cess
    } = payload;

    const quantityQuintals = Number(quantityKg) / 100.0;

    // 1. Fetch real Agmarknet prices for this commodity across mandis
    const priceRows = await repository.getMandiPrices(cropId);
    if (priceRows.length === 0) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'NO_PRICE_DATA', message: 'No current market data found for this crop' }),
      };
    }

    // 2. Perform Code-Owned Arithmetic for each candidate mandi
    const comparisons = priceRows.map((mandi) => {
      // Distance estimation factor (if distant, transport scales)
      const dist = mandi.distance_km ?? 0;
      const distanceScale = dist > 0 ? (dist / 50.0) : 1;
      const effectiveTransportPerQuintal = Math.round(Number(transportCostPerQuintal) * Math.max(1, distanceScale));
      const totalTransportCost = Math.round(quantityQuintals * effectiveTransportPerQuintal);

      // Quality adjustment (Grade A gets full modal, Grade B gets -3%, Grade C gets -8%)
      let qualityMultiplier = 1.0;
      if (qualityGrade.includes('Grade B')) qualityMultiplier = 0.97;
      if (qualityGrade.includes('Grade C')) qualityMultiplier = 0.92;

      const effectiveRatePerKg = Math.round(mandi.modal_price_kg * qualityMultiplier * 10) / 10;
      const effectiveRatePerQuintal = Math.round(effectiveRatePerKg * 100);

      const grossValue = Math.round(Number(quantityKg) * effectiveRatePerKg);
      const mandiFee = Math.round(grossValue * (Number(mandiFeePercent) / 100.0));
      const weighmentFee = Math.round(quantityQuintals * 10); // Rs 10 per quintal standard weighing
      const totalDeductions = totalTransportCost + mandiFee + weighmentFee;
      const netInHand = Math.max(0, grossValue - totalDeductions);
      const netRealizationPerKg = Math.round((netInHand / Number(quantityKg)) * 10) / 10;

      return {
        mandiId: mandi.id,
        market: mandi.market,
        state: mandi.state,
        district: mandi.district,
        distanceKm: mandi.distance_km || 0,
        modalPriceKg: mandi.modal_price_kg,
        modalPriceQuintal: mandi.modal_price,
        effectiveRatePerKg,
        effectiveRatePerQuintal,
        grossValue,
        transportCost: totalTransportCost,
        mandiFee,
        weighmentFee,
        totalDeductions,
        netInHand,
        netRealizationPerKg,
      };
    });

    // Sort by highest net-in-hand return
    comparisons.sort((a, b) => b.netInHand - a.netInHand);
    const bestMandi = comparisons[0];
    const baselineMandi = comparisons[comparisons.length - 1];
    const netGainVsWorst = bestMandi.netInHand - baselineMandi.netInHand;

    // 3. Recommended "Do Not Sell Below" Floor Price (arithmetic in code)
    // Floor is min(modal_price - 8%, min_price) to protect farmer cost of production
    const recommendedFloorPerKg = Math.round(Math.max(bestMandi.modalPriceKg * 0.92, priceRows[0].min_price_kg) * 10) / 10;
    const recommendedFloorQuintal = Math.round(recommendedFloorPerKg * 100);

    // 4. Three Most Likely Tricks at Best Mandi
    const likelyTricks = [
      {
        name: 'Moisture Deduction (Katauti)',
        description: 'Trader claims 2–3% moisture excess and cuts weight on arrival.',
        counterMeasure: 'Demand APMC moisture meter test; standard dry benchmark allows up to 11% moisture without deduction.',
      },
      {
        name: 'Tare Manipulation (Kanta Tare Cut)',
        description: 'Deducting 1.5 kg per bag for gunny tare instead of certified 1.0 kg standard.',
        counterMeasure: 'Weigh 10 empty sample bags on certified digital kanta before unloading.',
      },
      {
        name: 'Delayed Payment (Udhaari Check)',
        description: 'Offering ₹2 more per kg only on 15-day delayed check or informal credit.',
        counterMeasure: 'Refuse credit; insist on same-day RTGS before leaving yard.',
      },
    ];

    const plainExplanation = `For your ${quantityQuintals} Quintals (${quantityKg} kg), ${bestMandi.market} offers the strongest net-in-hand payout of ₹${bestMandi.netInHand.toLocaleString('en-IN')} (net ₹${bestMandi.netRealizationPerKg}/kg), which is ₹${netGainVsWorst.toLocaleString('en-IN')} higher than other markets after logistics. Do not sell below ₹${recommendedFloorPerKg}/kg.`;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        cropId,
        quantityKg,
        quantityQuintals,
        qualityGrade,
        bestMandi,
        netGainVsWorst,
        recommendedFloorPerKg,
        recommendedFloorQuintal,
        comparisons,
        likelyTricks,
        plainExplanation,
        disclaimer: 'Pre-trip logistics estimate based on Agmarknet modal benchmarks. Final weighment and grading conducted at APMC yard.',
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'PLANNER_FAILED', message: (err as Error).message }),
    };
  }
};
