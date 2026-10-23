import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/telemetry.mjs';

test('native ingress exposes only the anonymous event route', async () => {
  const env = { API: { fetch() { throw new Error('Must not forward a different route'); } } };
  for (const path of ['/api/v1/telemetry/summary', '/api/v1/launcher/activity-events', '/v1/events/other', '/v1/events?account=other', '/']) {
    assert.equal((await worker.fetch(new Request('https://telemetry.test'+path), env)).status, 404);
  }
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']) {
    const response = await worker.fetch(new Request('https://telemetry.test/v1/events', { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
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
