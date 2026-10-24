import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlatform } from './platform-client-fixture.mjs';
import { hasLegacyPaddleHistory, hasLegacyPaddleSubscription } from '../src/utils/subscriptionPlan.ts';
test('a Paddle customer ID alone never selects Paddle, and Waffo ownership remains primary', () => {
  const customer = { paddleCustomerId: 'ctm_old', subscriptions: [], cloudPlus: true };
  assert.equal(hasLegacyPaddleHistory(customer), false); assert.equal(hasLegacyPaddleSubscription(customer), false);
  assert.equal(hasLegacyPaddleSubscription({ ...customer, billingProvider: 'waffo', subscriptions: [{ status: 'active' }] }), false);
  assert.equal(hasLegacyPaddleSubscription({ ...customer, billingProvider: 'paddle', subscriptions: [{ status: 'active' }] }), true);
  assert.equal(hasLegacyPaddleSubscription({ ...customer, billingProvider: 'paddle', subscriptions: [{ status: 'canceled' }] }), false);
});
test('the shared account management action opens only the production Waffo portal by default', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    if (String(url).startsWith('https://auth.pcln.top/')) return Response.json({ token: 'fixture-token', user: { id: 'alice', name: 'Alice', termsAccepted: 1 } });
    assert.equal(url, '/api/v1/billing/waffo/portal'); assert.equal(init.body, '{}');
    return Response.json({ provider: 'waffo', mode: 'prod', portalUrl: 'https://pancake.waffo.ai/consumer/portal/store/STO_fixture#token=fixture.JWT.value', expiresAt: new Date(Date.now() + 60000).toISOString() });
  });
  const { platform, redirects } = await loadPlatform(t); await platform.billingPortal();
  assert.equal(new URL(redirects[0]).origin, 'https://pancake.waffo.ai');
  assert.equal(calls.filter(row => row.url === '/api/v1/billing/portal').length, 0);
});
test('a failed Waffo portal never falls back to Paddle and an account switch prevents redirect', async t => {
  let failed = true, owner = 'alice'; const calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(url);
    if (String(url).startsWith('https://auth.pcln.top/')) return Response.json({ token: 'fixture-token', user: { id: owner, name: owner } });
    assert.equal(url, '/api/v1/billing/waffo/portal');
    if (failed) return Response.json({ detail: 'waffo_live_subscription_not_found' }, { status: 409 });
    owner = 'bob';
    return Response.json({ provider: 'waffo', mode: 'prod', portalUrl: 'https://pancake.waffo.ai/consumer/portal/store/STO_fixture#token=fixture.JWT.value', expiresAt: new Date(Date.now() + 60000).toISOString() });
  });
  const { platform, redirects } = await loadPlatform(t);
  await assert.rejects(platform.billingPortal()); assert.deepEqual(redirects, []);
  failed = false; await assert.rejects(platform.billingPortal(), /账户已切换/); assert.deepEqual(redirects, []);
  assert.equal(calls.some(url => String(url).includes('provider=paddle')), false);
});
