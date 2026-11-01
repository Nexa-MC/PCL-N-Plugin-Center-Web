import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlatform } from './platform-client-fixture.mjs';

test('OAuth uses the confirmed Auth policy version rather than the bundled version', async t => {
  const { platform, redirects } = await loadPlatform(t);
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://auth.pcln.top/auth/v1/policies/current');
    assert.equal(init.credentials, 'include');
    return Response.json({ terms: { version: '1.1' }, privacy: { version: '1.1' } });
  };
  const policies = await platform.currentPolicies();
  for (const provider of ['github', 'google', 'microsoft']) {
    platform.oauthStart(provider, '/account', 'login', policies.terms.version);
    const target = new URL(redirects.at(-1));
    assert.equal(target.pathname, `/auth/v1/oauth/${provider}/start`);
    assert.equal(target.searchParams.get('tos'), '1.1');
    assert.equal(target.searchParams.get('return_to'), '/account');
  }
  assert.throws(() => platform.oauthStart('github'), /请先阅读并确认/);
  platform.oauthStart('github', '/account', 'link');
  assert.equal(new URL(redirects.at(-1)).searchParams.has('tos'), false);
});

test('failed policy discovery is surfaced without a bundled version fallback', async t => {
  const { platform, redirects } = await loadPlatform(t);
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async () => Response.json({ detail: '政策文档尚未配置' }, { status: 503 });
  await assert.rejects(platform.currentPolicies(), /政策文档尚未配置/);
  assert.equal(redirects.length, 0);
});
