import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(await readFile(new URL('../src/config/pricing.ts', import.meta.url), 'utf8'));
const { tiersFor } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('live prices never fall back to sandbox IDs and require real price identifiers', () => {
  const sandbox = tiersFor('sandbox');
  assert.equal(sandbox.length, 4);
  const settings = {};
  let sequence = 0;
  for (const tier of sandbox) for (const cycle of ['month', 'year']) {
    settings[`VITE_PADDLE_PRICE_${tier.name.toUpperCase()}_${cycle.toUpperCase()}`] = `pri_${String(++sequence).padStart(26, '0')}`;
  }
  const live = tiersFor('production', settings);
  assert.equal(new Set(live.flatMap(t => Object.values(t.priceId))).size, 8);
  assert.notEqual(live[0].priceId.month, sandbox[0].priceId.month);
  for (const environment of ['production', undefined, 'live']) {
    assert.ok(tiersFor(environment).every(t => !t.priceId.month && !t.priceId.year));
  }
  settings.VITE_PADDLE_PRICE_LITE_MONTH = sandbox[3].priceId.year;
  settings.VITE_PADDLE_PRICE_LITE_YEAR = 'pri_invalid';
  assert.deepEqual(tiersFor('production', settings)[0].priceId, { month: '', year: '' });
  assert.deepEqual(tiersFor('sandbox'), sandbox);
});
