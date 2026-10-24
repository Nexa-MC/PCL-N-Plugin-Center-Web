import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTestReturn, testOrderResults, parseBillingReturn, billingOrderResults } from '../src/utils/checkoutResult.ts';
const id = '12345678-1234-1234-1234-123456789abc';
test('test return accepts only explicit Waffo test scope and never consumes paid or redirect claims', () => {
  assert.deepEqual(parseTestReturn('?provider=waffo&mode=test'), { valid: true, intentId: null });
  assert.deepEqual(parseTestReturn(`?provider=waffo&mode=test&intent=${id}&paid=true&returnTo=https://untrusted.test`), { valid: true, intentId: id });
  for (const query of ['', '?provider=paddle&mode=test', '?provider=waffo&mode=live', '?provider=waffo&mode=test&intent=ORD_foreign', '?provider=waffo&mode=test&mode=live', `?provider=waffo&mode=test&intent=${id}&intent=${id}`]) assert.equal(parseTestReturn(query).valid, false);
});
test('production return accepts only production server results and never promotes test or URL payment claims', () => {
  assert.deepEqual(parseBillingReturn('?provider=waffo&mode=prod&paid=true'), { valid: true, mode: 'prod', intentId: null });
  assert.equal(parseBillingReturn('?provider=waffo&mode=prod&mode=test').valid, false);
  const row = { intentId: id, offerId: 'cloud-plus:lite:month', amountMinor: '310', currency: 'JPY', status: 'pending', createdAt: Date.now(), validUntil: null };
  assert.equal(billingOrderResults({ provider: 'waffo', mode: 'prod', productionAccess: true, orders: [row] }, 'prod').orders[0].status, 'pending');
  assert.throws(() => billingOrderResults({ provider: 'waffo', mode: 'test', productionAccess: false, orders: [row] }, 'prod'));
  assert.throws(() => billingOrderResults({ provider: 'waffo', mode: 'prod', productionAccess: true, orders: [{ ...row, status: 'paid' }] }, 'prod'));
});
test('result rendering requires server test scope, current typed status and no production access', () => {
  const row = { intentId: id, offerId: 'cloud-plus:lite:month', amountMinor: '199', currency: 'USD', status: 'pending', createdAt: Date.now(), validUntil: null };
  const value = { provider: 'waffo', mode: 'test', productionAccess: false, orders: [row] };
  assert.equal(testOrderResults(value).orders[0].status, 'pending');
  for (const changed of [{ ...value, mode: 'live' }, { ...value, productionAccess: true }, { ...value, orders: [{ ...row, status: 'paid' }] }, { ...value, orders: [{ ...row, amountMinor: '-1' }] }]) assert.throws(() => testOrderResults(changed));
});
