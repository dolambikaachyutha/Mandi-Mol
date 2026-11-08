import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FunctionEvent, Handler } from './functions/types';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

function normalizeHeaders(headers: IncomingMessage['headers']): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === 'string') normalized[name] = value;
    else if (Array.isArray(value)) normalized[name] = value.join(',');
  }
  return normalized;
}

function serializeBody(body: unknown): string | null {
  if (body === undefined || body === null) return null;
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  return JSON.stringify(body);
}

export function createVercelHandler(handler: Handler) {
  return async (request: VercelRequest, response: ServerResponse): Promise<void> => {
    const rawUrl = request.url || '/';
    const url = new URL(rawUrl, `https://${request.headers.host || 'localhost'}`);
    const event: FunctionEvent = {
      httpMethod: (request.method || 'GET').toUpperCase(),
      path: url.pathname,
      headers: normalizeHeaders(request.headers),
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      body: serializeBody(request.body),
      isBase64Encoded: false,
      rawUrl: `https://${request.headers.host || 'localhost'}${rawUrl}`,
      rawQuery: url.search.replace(/^\?/, ''),
    };

    try {
      const result = await handler(event);
      response.statusCode = result.statusCode ?? 200;
      for (const [name, value] of Object.entries(result.headers || {})) {
        if (value !== undefined) response.setHeader(name, String(value));
      }

      const body = result.body || '';
      response.end(result.isBase64Encoded ? Buffer.from(body, 'base64') : body);
    } catch (error) {
      console.error('[vercel-function] Handler failed:', error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({
        error: 'FUNCTION_ERROR',
        message: error instanceof Error ? error.message : 'Function request failed',
      }));
    }
  };
}
