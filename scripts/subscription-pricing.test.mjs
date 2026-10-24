import test from 'node:test';
import assert from 'node:assert/strict';
import { REGIONAL_CURRENCIES, SUPPORTED_SUBSCRIPTION_CURRENCIES, regionalAmount, regionalCurrencyFor } from '../src/config/regionalPricing.ts';
import { confirmedPlan, planAction } from '../src/utils/subscriptionPlan.ts';
test('regional prices use the approved custom table and exact ten-month annual amounts', () => {
  assert.equal(REGIONAL_CURRENCIES.length, 11); assert.equal(SUPPORTED_SUBSCRIPTION_CURRENCIES.size, 5);
  assert.equal(regionalAmount('Lite', 'CNY', 'month'), '12.99'); assert.equal(regionalAmount('Ultimate', 'HKD', 'month'), '156.90');
  const hundredths = value => { const [a, b = ''] = value.split('.'); return BigInt(a) * 100n + BigInt(b.padEnd(2, '0')); };
  for (const currency of REGIONAL_CURRENCIES) for (const tier of ['Lite', 'Standard', 'Advanced', 'Ultimate']) assert.equal(hundredths(regionalAmount(tier, currency, 'year')), hundredths(regionalAmount(tier, currency, 'month')) * 10n);
  assert.equal(regionalCurrencyFor('CN'), 'CNY'); assert.equal(SUPPORTED_SUBSCRIPTION_CURRENCIES.has('CNY'), false);
  assert.equal(regionalCurrencyFor('GB'), 'GBP'); assert.equal(regionalCurrencyFor('DE'), 'EUR'); assert.equal(regionalCurrencyFor(null), 'USD');
});
test('verified current tier and billing cycle distinguish upgrade, current, downgrade and cycle change', () => {
  const lite = confirmedPlan({ rank: 1, status: 'trialing', billingCycle: 'month' });
  assert.equal(planAction(lite, 1, 'month'), 'current'); assert.equal(planAction(lite, 1, 'year'), 'switch_cycle'); assert.equal(planAction(lite, 2, 'month'), 'upgrade');
  assert.equal(planAction(confirmedPlan({ rank: 4, status: 'active', billingCycle: 'year' }), 2, 'year'), 'downgrade');
  assert.equal(planAction(confirmedPlan({ rank: 0, status: 'free', billingCycle: null }), 1, 'month'), 'subscribe');
  assert.equal(planAction(null, 4, 'month'), 'unknown');
  for (const value of [{ rank: 9, status: 'active' }, { rank: 1, status: 'pending' }, { rank: 1, status: 'active', billingCycle: 'day' }]) assert.equal(confirmedPlan(value), null);
  assert.equal(confirmedPlan({ id: 'cloud-plus', rank: 1, status: 'active', billingCycle: 'month' }), null);
  assert.equal(confirmedPlan({ id: 'ultimate', rank: 1, status: 'active', billingCycle: 'month' }), null);
});
