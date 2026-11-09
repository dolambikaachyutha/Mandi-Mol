import crypto from 'node:crypto';
import type { Handler } from './types';
import { repository } from '../db/repository';
import type { PriceAlertRecord } from '../db/types';

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
  const rateLimit = repository.checkRateLimit(`alerts_${clientIp}`, 60, 60000);
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many alert requests. Please slow down.',
      }),
    };
  }

  // GET: Fetch user's active price alerts
  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.userId || 'anonymous';
    const alerts = repository.getUserAlerts(userId);

    // Enrich alerts with current live prices
    const enriched = alerts.map((alert) => {
      const liveRates = repository.getLatestPrices(alert.crop_id, alert.mandi_location);
      const currentModal = liveRates[0]?.modal_price_kg || (liveRates[0] as any)?.modal_price_per_kg || 0;
      const target = alert.target_price_per_kg ?? alert.target_price_kg ?? 0;
      const isTriggered =
        alert.condition === 'above'
          ? currentModal >= target
          : currentModal <= target;

      return {
        ...alert,
        currentModalPricePerKg: currentModal,
        isTriggered,
        status: isTriggered ? 'TRIGGERED' : 'MONITORING',
      };
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        userId,
        alerts: enriched,
        totalAlerts: enriched.length,
      }),
    };
  }

  // POST: Create a new price alert
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const {
        userId = 'anonymous',
        cropId,
        mandiLocation = 'Warangal APMC Yard',
        targetPricePerKg,
        condition = 'above',
        channel = 'push',
        phone = '',
      } = payload;

      if (!cropId || !targetPricePerKg) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'MISSING_FIELDS',
            message: 'cropId and targetPricePerKg are required to set a price alert.',
          }),
        };
      }

      const parsedTarget = Math.max(0.1, Number(targetPricePerKg));
      const liveRates = repository.getLatestPrices(cropId, mandiLocation);
      const currentModal = liveRates[0]?.modal_price_kg || (liveRates[0] as any)?.modal_price_per_kg || parsedTarget;

      const newAlert: PriceAlertRecord = {
        id: `alert_${crypto.randomUUID()}`,
        user_id: userId,
        crop_id: cropId,
        mandi_location: mandiLocation,
        target_price_per_kg: parsedTarget,
        condition: condition === 'below' ? 'below' : 'above',
        is_active: true,
        channel: channel === 'whatsapp' ? 'whatsapp' : 'push',
        phone,
        created_at: new Date().toISOString(),
      };

      repository.createAlert(newAlert);

      const isImmediatelyTriggered =
        newAlert.condition === 'above'
          ? currentModal >= parsedTarget
          : currentModal <= parsedTarget;

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          alert: newAlert,
          currentModalPricePerKg: currentModal,
          status: isImmediatelyTriggered ? 'TRIGGERED_NOW' : 'ACTIVE_MONITORING',
          message: isImmediatelyTriggered
            ? `Target met! Today's modal price ₹${currentModal}/kg is already ${newAlert.condition} your target ₹${parsedTarget}/kg.`
            : `Alert active. We will notify you via ${newAlert.channel} when ${cropId} reaches ₹${parsedTarget}/kg at ${mandiLocation}.`,
        }),
      };
    } catch (err) {
      console.error('[alerts] Error creating alert:', err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'ALERT_ERROR',
          message: err instanceof Error ? err.message : 'Failed to create price alert',
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
