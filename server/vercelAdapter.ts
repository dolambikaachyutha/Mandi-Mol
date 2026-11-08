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

async function extractBody(request: VercelRequest): Promise<string | null> {
  if (request.body !== undefined && request.body !== null) {
    return serializeBody(request.body);
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    return null;
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on('end', () => {
      if (chunks.length === 0) {
        resolve(null);
      } else {
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });
    request.on('error', (err) => {
      reject(err);
    });
  });
}

export function createVercelHandler(handler: Handler) {
  return async (request: VercelRequest, response: ServerResponse): Promise<void> => {
    const rawUrl = request.url || '/';
    const url = new URL(rawUrl, `https://${request.headers.host || 'localhost'}`);
    
    try {
      const body = await extractBody(request);
      const event: FunctionEvent = {
        httpMethod: (request.method || 'GET').toUpperCase(),
        path: url.pathname,
        headers: normalizeHeaders(request.headers),
        queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        body,
        isBase64Encoded: false,
        rawUrl: `https://${request.headers.host || 'localhost'}${rawUrl}`,
        rawQuery: url.search.replace(/^\?/, ''),
      };

      const result = await handler(event);
      response.statusCode = result.statusCode ?? 200;
      for (const [name, value] of Object.entries(result.headers || {})) {
        if (value !== undefined) response.setHeader(name, String(value));
      }

      const responseBody = result.body || '';
      response.end(result.isBase64Encoded ? Buffer.from(responseBody, 'base64') : responseBody);
    } catch (error) {
      console.error('[vercel-function] Handler failed:', error);
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({
          error: 'FUNCTION_ERROR',
          message: error instanceof Error ? error.message : 'Function request failed',
        }));
      }
    }
  };
}
