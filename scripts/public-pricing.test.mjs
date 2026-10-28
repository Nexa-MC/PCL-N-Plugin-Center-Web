import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONFIRMED_USD_PRICES, PUBLIC_PLANS } from '../src/config/publicPricing.ts';
import { deploymentTargets } from './deployment-targets.mjs';

test('public reference prices contain the confirmed eight USD amounts without checkout IDs', () => {
  assert.deepEqual(CONFIRMED_USD_PRICES, {
    Lite: { month: '199', year: '1990' }, Standard: { month: '399', year: '3990' },
    Advanced: { month: '999', year: '9990' }, Ultimate: { month: '1999', year: '19990' }
  });
  assert.deepEqual(PUBLIC_PLANS.map(plan => plan.trialDays), [7, null, null, null]);
  for (const plan of PUBLIC_PLANS) {
    assert.equal(plan.currency, 'USD');
    assert.equal('priceId' in plan, false);
    assert.ok(plan.features.length);
  }
});

test('public plans share the current subscription flow instead of stale disabled reference buttons', async () => {
  const source = await readFile(new URL('../src/views/cloud/PublicPlans.vue', import.meta.url), 'utf8');
  assert.match(source, /<SubscriptionPricing\s*\/>/);
  assert.doesNotMatch(source, /购买暂未开放|税费配置待核验|Paddle/);
});

test('release selects the affected site while preserving existing management-only deployments', () => {
  assert.deepEqual(deploymentTargets(['src/views/cloud/PublicPlans.vue', 'src/routers/index.ts', 'src/languages/uiMessages.json']), ['web']);
  assert.deepEqual(deploymentTargets(['public/legal/current/refunds.en.md']), ['web']);
  assert.deepEqual(deploymentTargets(['scripts/public-release.mjs']), ['web']);
  assert.deepEqual(deploymentTargets(['src/utils/checkoutResult.ts']), ['web']);
  assert.deepEqual(deploymentTargets(['src/config/regionalPricing.ts', 'src/utils/subscriptionPlan.ts']), ['web']);
  assert.deepEqual(deploymentTargets(['src/config/contact.ts']), ['web']);
  assert.deepEqual(deploymentTargets(['src/views/manage/Users.vue']), ['manage']);
  for (const file of ['src/styles/design-system.css', 'src/styles/theme.css', 'src/styles/cloud.css', 'src/main.ts']) assert.deepEqual(deploymentTargets([file]), ['web', 'manage']);
  assert.deepEqual(deploymentTargets(['src/languages/uiMessages.json']), ['manage']);
  assert.deepEqual(deploymentTargets(['src/views/cloud/Home.vue', 'wrangler.manage.jsonc']), ['web', 'manage']);
});

test('refund update preserves old plan clauses and separates unused token fees from store revenue share', async () => {
  for (const locale of ['en', 'zh-CN']) {
    const old = await readFile(new URL(`../public/legal/archive/1.0/refunds.${locale}.md`, import.meta.url), 'utf8');
    const current = await readFile(new URL(`../public/legal/current/refunds.${locale}.md`, import.meta.url), 'utf8');
    assert.equal(current.slice(current.indexOf('## 1.'), current.indexOf('## 28.')).trim(), old.slice(old.indexOf('## 1.')).trim());
  }
  const english = await readFile(new URL('../public/legal/current/refunds.en.md', import.meta.url), 'utf8');
  for (const text of ['CNY 1 = 10 N Tokens', 'original payment method and transaction', 'manual approval', 'whole tokens', 'non-waivable rights', 'full actual payment-provider fee', 'only once', 'no negative net refund', '20% platform revenue share']) assert.ok(english.includes(text), text);
});
