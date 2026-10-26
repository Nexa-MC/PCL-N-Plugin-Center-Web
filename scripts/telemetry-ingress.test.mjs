import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/telemetry.mjs';

test('native ingress exposes only the anonymous event route', async () => {
  const env = { API: { fetch() { throw new Error('Must not forward a different route'); } } };
  for (const path of ['/api/v1/telemetry/summary', '/api/v1/launcher/activity-events', '/v1/events/other', '/v1/events?account=other', '/webhooks/wp_wh/test', '/webhooks/wp_wh/live/extra', '/webhooks/wp_wh/live?mode=test', '/']) {
    assert.equal((await worker.fetch(new Request('https://telemetry.test'+path), env)).status, 404);
  }
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']) {
    const response = await worker.fetch(new Request('https://telemetry.test/v1/events', { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
});

test('live bot-only webhook preserves exact signed bytes and strips client authority', async () => {
  const bytes = new TextEncoder().encode('{ "mode": "prod", "text": "原始字节\\n" }\n');
  const response = await worker.fetch(new Request('https://botonly.pcln.top/webhooks/wp_wh/live', {
    method: 'POST', body: bytes, headers: { 'content-type': 'application/json', 'x-waffo-signature': 't=fixture,v1=fixture', authorization: 'Bearer private', cookie: 'private', 'x-nexa-gateway-token': 'forged', 'x-nexa-client-certificate': 'forged', origin: 'https://pcln.top', 'x-nexa-request': '1' }
  }), { API: { async fetch(request) {
    assert.equal(request.url, 'https://nexa-api.internal/api/webhooks/waffo-live');
    assert.equal(request.redirect, 'manual'); assert.deepEqual(new Uint8Array(await request.arrayBuffer()), bytes);
    assert.equal(request.headers.get('x-waffo-signature'), 't=fixture,v1=fixture');
    for (const name of ['authorization', 'cookie', 'x-nexa-gateway-token', 'x-nexa-client-certificate', 'origin', 'x-nexa-request']) assert.equal(request.headers.get(name), null);
    return Response.json({ state: 'accepted' }, { headers: { 'set-cookie': 'private', location: 'https://other.test', 'cache-control': 'public' } });
  } } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('x-nexa-webhook'), 'waffo-live');
  assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('location'), null); assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('live ingress requires signed JSON POST and keeps failures retryable without SPA or redirects', async () => {
  const url = 'https://botonly.pcln.top/webhooks/wp_wh/live';
  const request = headers => new Request(url, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json', 'x-waffo-signature': 'fixture', ...headers } });
  const noCall = { API: { fetch: () => assert.fail('Invalid request must not reach API') } };
  assert.equal((await worker.fetch(new Request(url), noCall)).status, 405);
  assert.equal((await worker.fetch(request({ 'content-type': 'text/plain' }), noCall)).status, 415);
  assert.equal((await worker.fetch(new Request(url, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }), noCall)).status, 401);
  assert.equal((await worker.fetch(request({ 'content-length': '65537' }), noCall)).status, 413);
  assert.equal((await worker.fetch(request(), {})).status, 503);
  for (const upstream of [new Response('', { status: 404 }), new Response('', { status: 302 }), new Response('html', { headers: { 'content-type': 'text/html' } })]) {
    const response = await worker.fetch(request(), { API: { fetch: () => upstream } }); assert.equal(response.status, 503); assert.equal(response.headers.get('retry-after'), '30');
  }
  for (const status of [401, 403, 409, 429, 503]) {
    const response = await worker.fetch(request(), { API: { fetch: () => Response.json({ status }, { status }) } }); assert.equal(response.status, status); assert.equal(response.headers.get('x-nexa-webhook'), 'waffo-live');
  }
});

test('native ingress preserves bytes and API validation without forwarding account authority', async () => {
  const events = '[{"name":"app.started","level":"necessary","timestamp":1,"properties":{}}]';
  let calls = 0;
  const response = await worker.fetch(new Request('https://telemetry.test/v1/events', { method: 'POST', body: events, headers: {
    'content-type': 'application/json', authorization: 'Bearer private-user-token', cookie: 'session=private',
    'x-nexa-gateway-token': 'private-gateway', 'x-nexa-client-certificate': 'forged', origin: 'https://other.test',
    'x-nexa-request': '1', 'cf-connecting-ip': '192.0.2.10'
  } }), { API: { async fetch(request) {
    calls++;
    assert.equal(request.url, 'https://nexa-api.internal/api/v1/telemetry/events');
    assert.equal(request.method, 'POST');
    assert.equal(await request.text(), events);
    assert.equal(request.headers.get('content-type'), 'application/json');
    assert.equal(request.headers.get('cf-connecting-ip'), '192.0.2.10');
    for (const header of ['authorization', 'cookie', 'x-nexa-gateway-token', 'x-nexa-client-certificate', 'origin', 'x-nexa-request'])
      assert.equal(request.headers.get(header), null);
    assert.equal(request.redirect, 'manual');
    return new Response('invalid timestamp', { status: 400, headers: { 'cache-control': 'no-store' } });
  } } });
  assert.equal(calls, 1);
  assert.equal(response.status, 400);
  assert.equal(await response.text(), 'invalid timestamp');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('native ingress preserves retry signals and does not reveal service failures', async () => {
  const request = () => new Request('https://telemetry.test/v1/events', { method: 'POST', body: '[]' });
  const limited = await worker.fetch(request(), { API: { async fetch() { return new Response(null, { status: 429, headers: { 'retry-after': '60' } }); } } });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
  const failed = await worker.fetch(request(), { API: { async fetch() { throw new Error('private backend detail'); } } });
  assert.equal(failed.status, 503);
  assert.equal((await failed.text()).includes('private'), false);
});

test('announcements expose only a credential-free public read', async () => {
  const response = await worker.fetch(new Request('https://botonly.pcln.top/v1/announcements', { headers: { cookie: 'private', authorization: 'Bearer private' } }), { API: { fetch(request) {
    assert.equal(request.url, 'https://nexa-api.internal/api/v1/community/announcements');
    assert.equal(request.headers.get('authorization'), null); assert.equal(request.headers.get('cookie'), null);
    return Response.json({ announcements: [] });
  } } });
  assert.equal(response.status, 200);
  assert.equal((await worker.fetch(new Request('https://botonly.pcln.top/v1/announcements', {method:'POST'}), {})).status,405);
});
