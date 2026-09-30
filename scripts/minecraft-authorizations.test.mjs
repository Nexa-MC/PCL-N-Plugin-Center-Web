import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/platform.ts', import.meta.url), 'utf8');
let instance = 0;

async function loadPlatform(t) {
  const previousWindow = globalThis.window;
  const redirects = [];
  globalThis.window = { location: { origin: 'https://pcln.top', assign: value => redirects.push(value) }, dispatchEvent() {} };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  // Run the production client in Node without Vite, preserving its actual request implementation.
  const compiled = ts.transpileModule(source.replace('import.meta.env.DEV', 'false'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(compiled + `\n// fixture ${++instance}`).toString('base64')}`);
  return { ...module, redirects };
}

test('Minecraft authorization uses the Nexa session and a separate POST before navigating', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url, init });
    if (url === 'https://auth.pcln.top/auth/v1/tokens') return Response.json({ token: 'fixture-token', user: { id: 'fixture-user', name: 'Fixture' } });
    assert.equal(url, 'https://auth.pcln.top/auth/v1/minecraft/authorizations');
    return Response.json({ url: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?state=fixture' }, { status: 201 });
  });
  const { platform, redirects } = await loadPlatform(t);
  await platform.session();
  await platform.authorizeMinecraft();
  assert.equal(requests.length, 2);
  const { init } = requests[1];
  assert.equal(init.method, 'POST');
  assert.equal(init.body, '{}');
  assert.equal(init.credentials, 'include');
  assert.equal(init.headers.Authorization, 'Bearer fixture-token');
  assert.equal(init.headers['X-Nexa-Request'], '1');
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.deepEqual(redirects, ['https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?state=fixture']);
});

test('failed game authorization does not redirect or start the identity linking flow', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://auth.pcln.top/auth/v1/minecraft/authorizations');
    return Response.json({ detail: '请先关联 Microsoft 登录身份' }, { status: 409 });
  });
  const { platform, ApiError, redirects } = await loadPlatform(t);
  await assert.rejects(platform.authorizeMinecraft(), error => error instanceof ApiError && error.status === 409 && error.message === '请先关联 Microsoft 登录身份');
  assert.deepEqual(redirects, []);
});

test('revoking game authorization uses an authenticated DELETE and accepts an empty 204 without navigation', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url, init });
    if (url === 'https://auth.pcln.top/auth/v1/tokens') return Response.json({ token: 'fixture-token', user: { id: 'fixture-user', name: 'Fixture' } });
    assert.equal(url, 'https://auth.pcln.top/auth/v1/minecraft/authorization');
    return new Response(null, { status: 204 });
  });
  const { platform, redirects } = await loadPlatform(t);
  await platform.session();
  assert.equal(await platform.revokeMinecraftAuthorization(), undefined);
  assert.equal(requests.length, 2);
  const { init } = requests[1];
  assert.equal(init.method, 'DELETE');
  assert.equal(init.credentials, 'include');
  assert.equal(init.headers.Authorization, 'Bearer fixture-token');
  assert.equal(init.headers['X-Nexa-Request'], '1');
  assert.deepEqual(redirects, []);
});

test('revocation errors preserve server feedback and do not navigate or remove the login identity', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://auth.pcln.top/auth/v1/minecraft/authorization');
    return Response.json({ detail: '暂时无法撤销游戏授权，请重试。' }, { status: 503 });
  });
  const { platform, ApiError, redirects } = await loadPlatform(t);
  await assert.rejects(platform.revokeMinecraftAuthorization(), error => error instanceof ApiError && error.status === 503 && error.message === '暂时无法撤销游戏授权，请重试。');
  assert.deepEqual(redirects, []);
});

test('frontend fixture accounts never request a real Minecraft authorization', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; throw new Error('unexpected request'); });
  const { platform, testLogin, testLogout, ApiError, redirects } = await loadPlatform(t);
  testLogin();
  try {
    await assert.rejects(platform.authorizeMinecraft(), error => error instanceof ApiError && error.status === 403);
    await assert.rejects(platform.revokeMinecraftAuthorization(), error => error instanceof ApiError && error.status === 403);
    assert.equal(requests, 0);
    assert.deepEqual(redirects, []);
  } finally { testLogout(); }
});
