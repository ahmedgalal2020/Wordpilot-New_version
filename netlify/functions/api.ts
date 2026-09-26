import type { Config, Context } from '@netlify/functions';
import serverless from 'serverless-http';
import { app } from '../../server';

let handle: ReturnType<typeof serverless> | undefined;

export default async function api(request: Request, context: Context) {
  handle ??= serverless(app);
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  // Only platform-derived connection details reach Express's trusted proxy.
  headers.host = url.host;
  headers['x-forwarded-host'] = url.host;
  headers['x-forwarded-proto'] = url.protocol.slice(0, -1);
  headers['x-forwarded-for'] = context.ip;
  const bytes = await request.arrayBuffer();
  const result = await handle({
    version: '2.0',
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    headers,
    requestContext: { http: { method: request.method, path: url.pathname, sourceIp: context.ip, protocol: 'HTTP/1.1' } },
    body: Buffer.from(bytes).toString('base64'),
    isBase64Encoded: true,
  }, {}) as {
    statusCode: number; headers?: Record<string, string>; cookies?: string[];
    body: string; isBase64Encoded?: boolean;
  };
  const responseHeaders = new Headers(result.headers);
  for (const cookie of result.cookies ?? []) responseHeaders.append('set-cookie', cookie);
  const body = request.method === 'HEAD' || [204, 304].includes(result.statusCode)
    ? null : Buffer.from(result.body ?? '', result.isBase64Encoded ? 'base64' : 'utf8');
  return new Response(body, { status: result.statusCode, headers: responseHeaders });
}

export const config: Config = { path: '/api/*' };
