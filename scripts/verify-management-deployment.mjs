import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = 'https://manage.pcln.top';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
assert.ok(scripts.length, 'The local production build must contain script assets');

const get = (path, init = {}) => fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(20000), ...init });
async function verify() {
  const landing = await get('/');
  assert.equal(landing.status, 302, 'Management root must redirect');
  assert.equal(landing.headers.get('location'), origin + '/manage');
  console.log('PASS: management root redirect');

  for (const path of ['/manage', '/manage/users', '/manage/resources', '/manage/tickets', '/manage/applications', '/manage/audit', '/manage/telemetry']) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    const deployed = await response.text();
    for (const asset of scripts) assert.ok(deployed.includes(asset), `${path} must serve the current build`);
  }
  for (const asset of scripts) {
    const response = await get(asset);
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get('content-type') || '', /(?:java|ecma)script/);
  }
  console.log('PASS: all management pages, private headers and current build assets');

  for (const path of ['/api/v1/manage/summary', '/api/v1/manage/resources', '/api/v1/manage/audit', '/auth/v1/manage/users', '/auth/v1/manage/summary', '/auth/v1/applications/pending']) {
    const response = await get(path);
    assert.equal(response.status, 401, `${path} must reject anonymous callers`);
    assert.equal((await response.json()).status, 401);
  }
  const catalog = await get('/api/v1/resources?limit=1');
  assert.equal(catalog.status, 200);
  assert.ok(Array.isArray((await catalog.json()).data));
  console.log('PASS: API/Auth service bindings and anonymous access boundaries');

  const preflight = await fetch('https://auth.pcln.top/auth/v1/tokens', { method: 'OPTIONS', signal: AbortSignal.timeout(20000), headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-nexa-request' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  const rejected = await fetch('https://auth.pcln.top/auth/v1/tokens', { method: 'OPTIONS', signal: AbortSignal.timeout(20000), headers: { origin: 'https://untrusted.example', 'access-control-request-method': 'POST' } });
  assert.equal(rejected.status, 403);
  console.log('PASS: management login CORS and rejection of untrusted origins');
}

// Custom Domain DNS and certificates may need time after the first deployment.
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    await verify();
    console.log('Management production smoke checks completed successfully.');
    break;
  } catch (error) {
    if (attempt === 12) throw error;
    console.log(`Readiness check ${attempt}/12: ${error.message}; retrying in 10 seconds.`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
