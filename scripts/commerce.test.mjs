import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function client() {
  const source = (await readFile(new URL('../src/api/commerce.ts', import.meta.url), 'utf8')).replace(/^import .*from '\.\/platform';$/m,
    `const calls = []; let preview = false; class ApiError extends Error {};
    const isTestSession = () => preview;
    const request = async (path, options) => { calls.push({path, options}); return {}; };
    export const fixture = { calls, setPreview(value) { preview = value; } };`);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64') + '#fixture-' + crypto.randomUUID());
}

test('withdrawal amounts parse as exact integer CNY fen without rounding, exponent or overflow', async () => {
  const { cnyToFen } = await client();
  for (const [input, output] of [['100', 10000], ['100.01', 10001], ['0.29', 29], ['0.1', 10], [' 200.00 ', 20000], ['90071992547409.91', Number.MAX_SAFE_INTEGER]]) assert.equal(cnyToFen(input), output);
  for (const input of ['1.001', '100.999', '1e2', '-100', '100.', '01', 'NaN', '', '90071992547409.92']) assert.throws(() => cnyToFen(input));
});

test('financial requests keep stable keys and revisions and cannot submit balances, refunds or payment destinations', async () => {
  const { commerce, fixture, newCommerceKey } = await client();
  const key = newCommerceKey(); assert.match(key, /^[a-f0-9]{48}$/); assert.notEqual(newCommerceKey(), key);
  await commerce.refund('lot-verified', 10, 'Unused balance', key);
  await commerce.withdraw(10001, key);
  await commerce.discount({ id: 'product', revision: 7 }, 1);
  await commerce.review('token-refunds', { id: 'refund', version: 3 }, 'approve', 'Verified original transaction and actual provider fees');
  assert.deepEqual(fixture.calls.map(call => JSON.parse(call.options.body)), [
    { rechargeLotId: 'lot-verified', requestedTokens: 10, reason: 'Unused balance' }, { amountFen: 10001 },
    { discountedTokenPrice: 1 }, { decision: 'approve', note: 'Verified original transaction and actual provider fees' }
  ]);
  assert.equal(fixture.calls[0].options.headers['Idempotency-Key'], key);
  assert.equal(fixture.calls[1].options.headers['Idempotency-Key'], key);
  assert.equal(fixture.calls[2].options.headers['If-Match'], '"7"');
  assert.equal(fixture.calls[3].options.headers['If-Match'], '"3"');
  fixture.setPreview(true);
  assert.throws(() => commerce.refund('lot', 10, 'reason', key));
  assert.throws(() => commerce.withdraw(10000, key));
  assert.throws(() => commerce.decideSecurity({ id: 'item', revision: 1 }, 'confirmed_malicious', 'a'.repeat(64), 'evidence'));
  assert.throws(() => commerce.sync());
  assert.equal(fixture.calls.length, 4);
});
