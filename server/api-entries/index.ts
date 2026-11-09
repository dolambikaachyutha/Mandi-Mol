import type { FunctionEvent, FunctionResponse, Handler } from '../functions/types';
import { createVercelHandler } from '../vercelAdapter';

// Import all domain handlers
import { handler as coachHandler } from '../functions/coach';
import { handler as healthHandler } from '../functions/health';
import { handler as sttHandler } from '../functions/stt';
import { handler as traderHandler } from '../functions/trader';
import { handler as ttsHandler } from '../functions/tts';
import { handler as pricesHandler } from '../functions/prices';
import { handler as plannerHandler } from '../functions/planner';
import { handler as practiceSessionHandler } from '../functions/practiceSession';
import { handler as practiceTurnHandler } from '../functions/practiceTurn';
import { handler as dealsHandler } from '../functions/deals';
import { handler as alertsHandler } from '../functions/alerts';
import { handler as fpoDashboardHandler } from '../functions/fpoDashboard';
import { handler as voiceQueryHandler } from '../functions/voiceQuery';
import { handler as profileHandler } from '../functions/profile';
import { handler as consentHandler } from '../functions/consent';
import { handler as whatsappWebhookHandler } from '../functions/whatsappWebhook';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Route mapping table (case-insensitive & URL-normalized)
const routes: Record<string, Handler> = {
  // Speech & Voice
  stt: sttHandler,
  tts: ttsHandler,
  voicequery: voiceQueryHandler,

  // Reasoning & Coaching
  trader: traderHandler,
  coach: coachHandler,

  // Diagnostics & Status
  health: healthHandler,

  // Module 1: Live Mandi Prices & Alerts
  prices: pricesHandler,
  alerts: alertsHandler,

  // Module 2: Sell Planner
  planner: plannerHandler,

  // Module 3: Bargain Practice (dual routes for clean and legacy paths)
  practicesession: practiceSessionHandler,
  'practice/session': practiceSessionHandler,
  session: practiceSessionHandler,
  practiceturn: practiceTurnHandler,
  'practice/turn': practiceTurnHandler,
  turn: practiceTurnHandler,

  // Module 4: Deal Ledger & FPO Insights
  deals: dealsHandler,
  fpodashboard: fpoDashboardHandler,
  'fpo-dashboard': fpoDashboardHandler,
  fpo: fpoDashboardHandler,

  // User & Privacy (DPDP)
  profile: profileHandler,
  consent: consentHandler,

  // External Gateways
  whatsapp: whatsappWebhookHandler,
  whatsappwebhook: whatsappWebhookHandler,
};

function resolveRouteKey(event: FunctionEvent): string {
  // 1. Check if Vercel rewrite passed __route in query
  const routeQuery = event.queryStringParameters?.__route;
  if (routeQuery) {
    return routeQuery.toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\.js$/, '');
  }

  // 2. Check x-matched-path header (Vercel standard)
  const matchedPath = event.headers['x-matched-path'] || event.headers['x-invoke-path'] || '';
  if (matchedPath) {
    return matchedPath
      .replace(/^\/api\/?/i, '')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.js$/, '')
      .toLowerCase();
  }

  // 3. Fallback to event.path
  return (event.path || '')
    .replace(/^\/api\/?/i, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.js$/, '')
    .toLowerCase();
}

export const unifiedGatewayHandler: Handler = async (event: FunctionEvent): Promise<FunctionResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const routeKey = resolveRouteKey(event);

  // Strip internal __route from query parameters before passing to sub-handler
  const cleanedQuery = { ...event.queryStringParameters };
  delete cleanedQuery.__route;

  const subEvent: FunctionEvent = {
    ...event,
    path: `/api/${routeKey}`,
    queryStringParameters: cleanedQuery,
  };

  // Dispatch to registered handler
  const handler = routes[routeKey];
  if (handler) {
    return handler(subEvent);
  }

  // Root /api info response
  if (!routeKey || routeKey === 'index' || routeKey === 'api') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        name: 'Mandi Mol Unified API Gateway',
        version: '2.0.0',
        status: 'online',
        provider: 'Vercel Serverless (Unified Single Function)',
        activeRoutes: Object.keys(routes),
      }),
    };
  }

  // Unknown route
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: 'ROUTE_NOT_FOUND',
      message: `Endpoint '/api/${routeKey}' was not recognized by Mandi Mol gateway.`,
      availableEndpoints: Object.keys(routes),
    }),
  };
};

export default createVercelHandler(unifiedGatewayHandler);
