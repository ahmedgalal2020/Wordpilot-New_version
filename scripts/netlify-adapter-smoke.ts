import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { Context } from '@netlify/functions';

// Isolated values only; the assertions below must never contact external services.
process.env.NODE_ENV = 'production';
process.env.SUPABASE_URL = 'https://qa.example.invalid';
process.env.SUPABASE_ANON_KEY = 'qa-public-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'qa-server-key';
process.env.STRIPE_SECRET_KEY = 'qa-stripe-key';
process.env.STRIPE_WEBHOOK_SECRET = 'qa-webhook-secret';
process.env.APP_URL = 'https://wordpilot.example.invalid';
const { default: api } = await import('../netlify/functions/api');
const context = { ip: '192.0.2.1' } as Context;
const nativeFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Unexpected external request'); };
try {
  for (const route of ['/api/admin/access', '/api/youtube/transcript?videoId=QA_video001']) {
    const response = await api(new Request('https://wordpilot.example.invalid' + route), context);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('content-type') ?? '', /json/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  const blocked = await api(new Request('https://wordpilot.example.invalid/api/ai/generate', {
    method: 'POST', headers: { origin: 'https://untrusted.example.invalid', 'content-type': 'application/json' }, body: '{}',
  }), context);
  assert.equal(blocked.status, 403);
  const preflight = await api(new Request('https://wordpilot.example.invalid/api/ai/generate', {
    method: 'OPTIONS', headers: { origin: 'https://wordpilot.example.invalid' },
  }), context);
  assert.equal(preflight.status, 204);
  assert.equal(await preflight.text(), '');
  const body = '{ "type": "qa.ignored", "data": { "object": { "text": "Grüße" } } }';
  const time = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(time + '.' + body).digest('hex');
  for (const valid of [true, false]) {
    const response = await api(new Request('https://wordpilot.example.invalid/api/stripe/webhook', {
      method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': 't=' + time + ',v1=' + (valid ? signature : '00') }, body,
    }), context);
    assert.equal(response.status, valid ? 200 : 400);
    if (valid) assert.equal((await response.json()).ignored, true);
  }
  console.log('PASS: Netlify adapter routes, auth, origin guard, empty 204 and byte-exact signed Stripe webhook; no external requests.');
} finally {
  globalThis.fetch = nativeFetch;
}
