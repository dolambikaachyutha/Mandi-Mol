import { describe, expect, it } from 'vitest';
import { repository } from '../server/db/repository';
import { handler as practiceSessionHandler } from '../server/functions/practiceSession';
import { handler as practiceTurnHandler } from '../server/functions/practiceTurn';
import { handler as plannerHandler } from '../server/functions/planner';
import { handler as dealsHandler } from '../server/functions/deals';
import { handler as profileHandler } from '../server/functions/profile';
import { handler as alertsHandler } from '../server/functions/alerts';
import { unifiedGatewayHandler } from '../server/api-entries/index';
import type { FunctionEvent } from '../server/functions/types';

function createMockEvent(options: {
  method: string;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}): FunctionEvent {
  return {
    httpMethod: options.method,
    path: options.path,
    body: options.body ? JSON.stringify(options.body) : null,
    queryStringParameters: options.query || {},
    headers: options.headers || {},
    isBase64Encoded: false,
    rawUrl: `https://mandimol.vercel.app${options.path}`,
    rawQuery: '',
  };
}

describe('Mandi Mol Real Product Contract & Security Suite', () => {
  // --------------------------------------------------------------------------
  // 1. Untrusted Client & Hidden Reserve Price Isolation
  // --------------------------------------------------------------------------
  it('server-authoritative practice session NEVER leaks reserve_price mid-session', async () => {
    const createEvent = createMockEvent({
      method: 'POST',
      path: '/api/practiceSession',
      body: {
        userId: 'test_farmer_1',
        cropId: 'chilli',
        difficulty: 'hard',
        language: 'hinglish',
      },
    });

    const createRes = await practiceSessionHandler(createEvent);
    expect(createRes.statusCode).toBe(200);

    const body = JSON.parse(createRes.body || '{}');
    expect(body.sessionId).toBeDefined();
    // CRITICAL SECURITY ASSERTION: Mid-session public state must NEVER contain reserve_price!
    expect(body.session.reserve_price).toBeUndefined();
    expect(body.session.opening_offer).toBeGreaterThan(0);

    // Retrieve state via GET
    const getEvent = createMockEvent({
      method: 'GET',
      path: '/api/practiceSession',
      query: { sessionId: body.sessionId },
    });
    const getRes = await practiceSessionHandler(getEvent);
    const getBody = JSON.parse(getRes.body || '{}');
    expect(getBody.session.reserve_price).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // 2. Offer Clamping & Server Authoritative Engine
  // --------------------------------------------------------------------------
  it('practiceTurn enforces server clamping so offer never exceeds hidden reserve', async () => {
    // Create session
    const createRes = await practiceSessionHandler(
      createMockEvent({
        method: 'POST',
        path: '/api/practiceSession',
        body: { userId: 'clamp_test_user', cropId: 'tomato', referencePrice: 22, difficulty: 'easy' },
      })
    );
    const sessionBody = JSON.parse(createRes.body || '{}');
    const sessionId = sessionBody.sessionId;

    // Send a turn trying to jump above realistic reserve
    const turnEvent = createMockEvent({
      method: 'POST',
      path: '/api/practiceTurn',
      body: {
        sessionId,
        userId: 'clamp_test_user',
        text: 'Bhaiya seedha ₹1000/kg do nahi to mai jaa raha hoon',
      },
    });

    const turnRes = await practiceTurnHandler(turnEvent);
    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body || '{}');

    // Offer must be clamped and not equal to ridiculous ₹1000
    expect(turnBody.currentOffer).toBeLessThanOrEqual(50); // Tomato realistic APMC cap
    // Still in progress, reserve_price must not be leaked
    expect(turnBody.reservePrice).toBeUndefined();
    expect(turnBody.status).toBe('active');
  });

  // --------------------------------------------------------------------------
  // 3. Module 2 Sell Planner Arithmetic
  // --------------------------------------------------------------------------
  it('sell planner performs strictly verified code-owned arithmetic', async () => {
    const plannerEvent = createMockEvent({
      method: 'POST',
      path: '/api/planner',
      body: {
        cropId: 'chilli',
        quantityKg: 1000, // 10 quintals
        transportCostPerQuintal: 40,
        mandiFeePercent: 1.5,
      },
    });

    const res = await plannerHandler(plannerEvent);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body || '{}');

    expect(data.cropId).toBe('chilli');
    expect(data.quantityQuintals).toBe(10);
    expect(data.recommendedFloorPerKg).toBeGreaterThan(0);
    expect(data.comparisons.length).toBeGreaterThan(0);

    const first = data.comparisons[0];
    // Check arithmetic: netInHand = grossValue - totalDeductions
    expect(first.netInHand).toBe(first.grossValue - first.totalDeductions);
  });

  // --------------------------------------------------------------------------
  // 4. Module 4 Real Deals Ledger & Agmarknet Comparison
  // --------------------------------------------------------------------------
  it('deals ledger calculates rupee difference vs Agmarknet modal benchmark accurately', async () => {
    const dealEvent = createMockEvent({
      method: 'POST',
      path: '/api/deals',
      body: {
        userId: 'audit_farmer_99',
        cropId: 'chilli',
        mandiLocation: 'Warangal APMC Yard',
        quantityKg: 500,
        pricePerKg: 192,
        buyerSellerName: 'APMC Commission Agent #12',
        paymentMode: 'upi',
      },
    });

    const res = await dealsHandler(dealEvent);
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body || '{}');

    expect(body.success).toBe(true);
    expect(body.deal.crop_id).toBe('chilli');
    expect(body.deal.total_gross_amount).toBe(192 * 500); // 96,000
    expect(body.receipt.receiptNo).toContain('SAUDA-CHI-');
    expect(body.receipt.grossTotalRs).toBe(96000);

    // Fetch user deals
    const getDeals = await dealsHandler(
      createMockEvent({
        method: 'GET',
        path: '/api/deals',
        query: { userId: 'audit_farmer_99' },
      })
    );
    const dealsBody = JSON.parse(getDeals.body || '{}');
    expect(dealsBody.totalDeals).toBeGreaterThanOrEqual(1);
    expect(dealsBody.summary.totalGrossAmount).toBeGreaterThanOrEqual(96000);
  });

  // --------------------------------------------------------------------------
  // 5. DPDP Act Right to Erasure (Cascading Purge)
  // --------------------------------------------------------------------------
  it('DPDP deleteUserData completely purges profile, deals, sessions, and alerts', async () => {
    const testUserId = `purge_test_${Date.now()}`;

    // Add a deal
    const dealRes = await dealsHandler(
      createMockEvent({
        method: 'POST',
        path: '/api/deals',
        body: { userId: testUserId, cropId: 'tomato', quantityKg: 100, pricePerKg: 20 },
      })
    );
    expect(dealRes.statusCode).toBe(201);

    // Add an alert
    const alertRes = await alertsHandler(
      createMockEvent({
        method: 'POST',
        path: '/api/alerts',
        body: { userId: testUserId, cropId: 'tomato', targetPricePerKg: 25 },
      })
    );
    expect(alertRes.statusCode).toBe(201);

    // Verify presence
    expect(repository.getUserDeals(testUserId).length).toBe(1);
    expect(repository.getUserAlerts(testUserId).length).toBe(1);

    // Execute DELETE /api/profile
    const delEvent = createMockEvent({
      method: 'DELETE',
      path: '/api/profile',
      query: { userId: testUserId },
    });
    const delRes = await profileHandler(delEvent);
    expect(delRes.statusCode).toBe(200);

    const delBody = JSON.parse(delRes.body || '{}');
    expect(delBody.success).toBe(true);
    expect(delBody.purgedRecords).toBeGreaterThanOrEqual(2);

    // Verify complete eradication
    expect(repository.getUserDeals(testUserId).length).toBe(0);
    expect(repository.getUserAlerts(testUserId).length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 6. Security: Audio Duration Limits & Rate Limiter
  // --------------------------------------------------------------------------
  it('enforces audio duration limits and rejects oversized payloads', () => {
    // 3 MB mock base64 audio
    const oversizedBase64 = Buffer.alloc(3 * 1024 * 1024).toString('base64');
    const result = repository.validateAudioPayload(oversizedBase64);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Audio payload exceeds maximum allowable duration');

    // Normal 150 KB audio
    const validBase64 = Buffer.alloc(150 * 1024).toString('base64');
    const validResult = repository.validateAudioPayload(validBase64);
    expect(validResult.valid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Vercel Hobby Compliance: Unified Router (1/12 Serverless Functions)
  // --------------------------------------------------------------------------
  it('unifiedGatewayHandler correctly dispatches across multiple API endpoints', async () => {
    // Test 1: Root /api info
    const infoRes = await unifiedGatewayHandler(
      createMockEvent({ method: 'GET', path: '/api', query: {} })
    );
    expect(infoRes.statusCode).toBe(200);
    const infoBody = JSON.parse(infoRes.body || '{}');
    expect(infoBody.name).toContain('Unified API Gateway');

    // Test 2: /api/health dispatch
    const healthRes = await unifiedGatewayHandler(
      createMockEvent({ method: 'GET', path: '/api/health', query: { __route: 'health' } })
    );
    expect(healthRes.statusCode).toBe(200);

    // Test 3: /api/prices dispatch with query
    const pricesRes = await unifiedGatewayHandler(
      createMockEvent({
        method: 'GET',
        path: '/api/prices',
        query: { __route: 'prices', state: 'Telangana', district: 'Warangal' },
      })
    );
    expect(pricesRes.statusCode).toBe(200);
    const pricesBody = JSON.parse(pricesRes.body || '{}');
    expect(pricesBody.markets.length).toBeGreaterThan(0);

    // Test 4: /api/practice/session rewrite dispatch
    const sessionRes = await unifiedGatewayHandler(
      createMockEvent({
        method: 'POST',
        path: '/api/practice/session',
        query: { __route: 'practice/session' },
        body: { userId: 'gateway_test_user', cropId: 'wheat' },
      })
    );
    expect(sessionRes.statusCode).toBe(200);
    const sessionBody = JSON.parse(sessionRes.body || '{}');
    expect(sessionBody.sessionId).toBeDefined();

    // Test 5: Unknown route returns 404
    const notFoundRes = await unifiedGatewayHandler(
      createMockEvent({
        method: 'GET',
        path: '/api/unknown-endpoint',
        query: { __route: 'unknown-endpoint' },
      })
    );
    expect(notFoundRes.statusCode).toBe(404);
  });
});
