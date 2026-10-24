import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.mjs';

const url = 'https://pcln.top/webhooks/wp_wh/test';
const raw = '{ "mode": "test", "data": {"text":"保留原始字节\\n"} }\n';
const request = (options = {}) => new Request(url, { method: 'POST', body: raw, headers: { 'content-type': 'application/json', 'x-waffo-signature': 't=fixture,v1=fixture' }, ...options });
const assets = { fetch: () => assert.fail('Webhook must never fall back to SPA assets') };

test('Waffo public test URL preserves raw bytes/signature and removes browser/internal authority', async () => {
  const response = await worker.fetch(request({ headers: { 'content-type': 'application/json', 'x-waffo-signature': 't=fixture,v1=fixture', cookie: 'secret-session', authorization: 'Bearer attacker', 'x-nexa-gateway-token': 'forged', 'x-nexa-client-certificate': 'forged' } }), {
    ASSETS: assets, API: { fetch: async forwarded => {
      assert.equal(new URL(forwarded.url).pathname, '/api/webhooks/waffo-test'); assert.equal(forwarded.method, 'POST');
      assert.equal(await forwarded.text(), raw); assert.equal(forwarded.headers.get('x-waffo-signature'), 't=fixture,v1=fixture');
      for (const name of ['authorization', 'cookie', 'x-nexa-gateway-token', 'x-nexa-client-certificate']) assert.equal(forwarded.headers.get(name), null);
      return Response.json({ mode: 'test', state: 'applied' }, { headers: { 'set-cookie': 'must-not-propagate', 'cache-control': 'public' } });
    } }
  });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('x-nexa-webhook'), 'waffo-test');
});
test('Waffo endpoint rejects wrong method/type/missing signature and prod paths without touching API or SPA', async () => {
  const env = { ASSETS: assets, API: { fetch: () => assert.fail('Invalid webhook must not reach API') } };
  const get = await worker.fetch(new Request(url), env); assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await worker.fetch(request({ headers: { 'content-type': 'text/plain', 'x-waffo-signature': 'fixture' } }), env)).status, 415);
  assert.equal((await worker.fetch(request({ headers: { 'content-type': 'application/json' } }), env)).status, 401);
  assert.equal((await worker.fetch(new Request(url.replace('/test', '/prod')), env)).status, 404);
  assert.equal((await worker.fetch(new Request(url.replace('pcln.top', 'manage.pcln.top')), env)).status, 404);
});
test('missing/unreleased handlers, HTML fallback and redirects return retryable 503; verification errors remain errors', async () => {
  assert.equal((await worker.fetch(request(), { ASSETS: assets })).status, 503);
  for (const upstream of [new Response('absent', { status: 404 }), new Response('html', { headers: { 'content-type': 'text/html' } }), new Response('', { status: 302, headers: { location: '/login' } })]) {
    const response = await worker.fetch(request(), { ASSETS: assets, API: { fetch: () => upstream } });
    assert.equal(response.status, 503); assert.equal(response.headers.get('retry-after'), '30');
  }
  for (const status of [401, 403, 409, 503]) {
    const response = await worker.fetch(request(), { ASSETS: assets, API: { fetch: () => Response.json({ status }, { status }) } });
    assert.equal(response.status, status);
  }
});
test('asset routing runs the Worker before SPA handling for the exact Waffo namespace and retains Paddle proxy', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.ok(config.assets.run_worker_first.includes('/webhooks/wp_wh/*'));
  const input = new Request('https://pcln.top/api/webhooks/paddle', { method: 'POST', body: raw, headers: { 'paddle-signature': 'unchanged' } });
  const response = await worker.fetch(input, { API: { fetch: async forwarded => {
    assert.equal(forwarded.url, input.url); assert.equal(forwarded.headers.get('paddle-signature'), 'unchanged'); assert.equal(await forwarded.text(), raw);
    return new Response('existing Paddle handler');
  } } });
  assert.equal(await response.text(), 'existing Paddle handler');
});
