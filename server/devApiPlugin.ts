/**
 * Vite dev middleware that mounts the Netlify functions at
 * /.netlify/functions/<name> exactly like the production host does.
 *
 * The handlers are loaded through Vite's SSR module runner so TypeScript,
 * path aliases and edits are picked up without a separate build step.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

const FUNCTION_PREFIX = '/.netlify/functions/';

interface NetlifyLikeResult {
  statusCode?: number;
  headers?: Record<string, string | number | boolean | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function handleFunctionRequest(
  server: ViteDevServer,
  functionsDir: string,
  req: IncomingMessage,
  res: ServerResponse
) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const name = decodeURIComponent(url.pathname.slice(FUNCTION_PREFIX.length)).replace(/\/+$/, '');

  if (!/^[a-z0-9_-]+$/i.test(name)) {
    sendJson(res, 400, { error: 'INVALID_FUNCTION_NAME' });
    return;
  }

  const filePath = path.join(functionsDir, `${name}.ts`);
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: 'FUNCTION_NOT_FOUND', message: `No handler at ${filePath}` });
    return;
  }

  const body = await readBody(req);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = Array.isArray(value) ? value.join(',') : value ?? '';
  }

  const event = {
    path: url.pathname,
    httpMethod: (req.method || 'GET').toUpperCase(),
    headers,
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    body: body.length > 0 ? body : null,
    isBase64Encoded: false,
    rawUrl: `http://${req.headers.host || 'localhost'}${req.url}`,
    rawQuery: url.search.replace(/^\?/, ''),
  };

  const module = (await server.ssrLoadModule(filePath)) as {
    handler?: (event: unknown, context: unknown) => Promise<NetlifyLikeResult> | NetlifyLikeResult;
    default?: (event: unknown, context: unknown) => Promise<NetlifyLikeResult> | NetlifyLikeResult;
  };

  const handler = module.handler || module.default;
  if (typeof handler !== 'function') {
    sendJson(res, 500, { error: 'INVALID_HANDLER', message: `${name}.ts does not export a handler` });
    return;
  }

  const result = await handler(event, {});
  res.statusCode = result?.statusCode || 200;

  for (const [key, value] of Object.entries(result?.headers || {})) {
    if (value !== undefined) res.setHeader(key, String(value));
  }

  res.end(result?.body ?? '');
}

export function netlifyFunctionsDevPlugin(options: { functionsDir: string }): Plugin {
  return {
    name: 'mandi-netlify-functions-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith(FUNCTION_PREFIX)) {
          next();
          return;
        }

        handleFunctionRequest(server, options.functionsDir, req, res).catch((error: unknown) => {
          const message = error instanceof Error ? error.stack || error.message : String(error);
          server.config.logger.error(`[netlify-functions] ${req.url} failed: ${message}`);
          if (!res.headersSent) {
            sendJson(res, 500, { error: 'FUNCTION_CRASHED', message: message.split('\n')[0] });
          } else {
            res.end();
          }
        });
      });
    },
  };
}
