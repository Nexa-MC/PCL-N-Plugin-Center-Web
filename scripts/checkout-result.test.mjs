import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTestReturn, testOrderResults } from '../src/utils/checkoutResult.ts';
const id = '12345678-1234-1234-1234-123456789abc';
test('test return accepts only explicit Waffo test scope and never consumes paid or redirect claims', () => {
  assert.deepEqual(parseTestReturn('?provider=waffo&mode=test'), { valid: true, intentId: null });
  assert.deepEqual(parseTestReturn(`?provider=waffo&mode=test&intent=${id}&paid=true&returnTo=https://untrusted.test`), { valid: true, intentId: id });
  for (const query of ['', '?provider=paddle&mode=test', '?provider=waffo&mode=live', '?provider=waffo&mode=test&intent=ORD_foreign', '?provider=waffo&mode=test&mode=live', `?provider=waffo&mode=test&intent=${id}&intent=${id}`]) assert.equal(parseTestReturn(query).valid, false);
});
test('result rendering requires server test scope, current typed status and no production access', () => {
  const row = { intentId: id, offerId: 'cloud-plus:lite:month', amountMinor: '199', currency: 'USD', status: 'pending', createdAt: Date.now(), validUntil: null };
  const value = { provider: 'waffo', mode: 'test', productionAccess: false, orders: [row] };
  assert.equal(testOrderResults(value).orders[0].status, 'pending');
  for (const changed of [{ ...value, mode: 'live' }, { ...value, productionAccess: true }, { ...value, orders: [{ ...row, status: 'paid' }] }, { ...value, orders: [{ ...row, amountMinor: '-1' }] }]) assert.throws(() => testOrderResults(changed));
});
