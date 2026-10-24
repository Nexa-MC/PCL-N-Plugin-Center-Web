import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONFIRMED_USD_PRICES, PUBLIC_PLANS } from '../src/config/publicPricing.ts';
import { deploymentTargets } from './deployment-targets.mjs';

test('public reference prices contain the confirmed eight USD amounts without checkout IDs', () => {
  assert.deepEqual(CONFIRMED_USD_PRICES, {
    Lite: { month: '99', year: '990' }, Standard: { month: '299', year: '2999' },
    Advanced: { month: '799', year: '7999' }, Ultimate: { month: '1799', year: '17999' }
  });
  assert.deepEqual(PUBLIC_PLANS.map(plan => plan.trialDays), [7, null, null, null]);
  for (const plan of PUBLIC_PLANS) {
    assert.equal(plan.currency, 'USD');
    assert.equal('priceId' in plan, false);
    assert.ok(plan.features.length);
  }
});

test('public page works without payment SDK/configuration and keeps purchases closed', async () => {
  const source = await readFile(new URL('../src/views/cloud/PublicPlans.vue', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /paddle|platform\.|import\.meta\.env|fetch\(/i);
  assert.match(source, /<button class="primary-button" disabled>/);
  assert.match(source, /税费配置待核验/);
  assert.match(source, /to="\/legal\/refunds"/);
});

test('release selects the affected site while preserving existing management-only deployments', () => {
  assert.deepEqual(deploymentTargets(['src/views/cloud/PublicPlans.vue', 'src/routers/index.ts', 'src/languages/uiMessages.json']), ['web']);
  assert.deepEqual(deploymentTargets(['public/legal/current/refunds.en.md']), ['web']);
  assert.deepEqual(deploymentTargets(['src/views/manage/Users.vue']), ['manage']);
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
  for (const text of ['CNY 1 = 10 N Tokens', 'original payment method and transaction', 'manual approval', 'whole tokens', 'non-waivable rights', 'Allocation of fees', 'remains unconfirmed', 'not silently prorated', '20% platform revenue share']) assert.ok(english.includes(text), text);
});
