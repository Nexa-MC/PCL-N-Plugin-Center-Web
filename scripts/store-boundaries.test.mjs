import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const root = new URL('../', import.meta.url);

test('publisher hosts preserve the exact requested spelling and private response boundaries', async () => {
  const source = (await readFile(new URL('worker/index.mjs', root), 'utf8')).replace("import { fetchReleaseCatalogs } from '../src/utils/releaseCatalog.ts';", 'const fetchReleaseCatalogs = async () => [];');
  const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  for (const [host, landing] of [['dev.consol.pcln.top', '/publisher/plugins'], ['creator.consol.pcln.top', '/publisher/themes']]) {
    const response = await worker.fetch(new Request('https://' + host + '/'), {});
    assert.equal(response.status, 302); assert.equal(response.headers.get('location'), 'https://' + host + landing);
    const page = await worker.fetch(new Request('https://' + host + landing), { ASSETS: { fetch: async () => new Response('fixture assets') } });
    assert.equal(page.headers.get('cache-control'), 'no-store'); assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(page.headers.get('x-frame-options'), 'DENY');
  }
});

test('store client sends server product revisions, stable idempotency keys and no client price or balance', async () => {
  const source = (await readFile(new URL('src/api/store.ts', root), 'utf8')).replace(/^import .*from '\.\/platform';$/m,
    `const calls = []; let preview = false; class ApiError extends Error {};
    const isTestSession = () => preview; const requestBlob = () => { throw new Error('not used'); };
    const request = async (path, options) => { calls.push({ path, options }); return {}; };
    export const fixture = { calls, setPreview(value) { preview = value; } };`);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const { store, fixture } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
  const product = { id: 'product-fixture', revision: 3, token_price: 999 };
  await store.purchase(product, 'fixture-idempotency-key');
  assert.deepEqual(JSON.parse(fixture.calls[0].options.body), { productRevision: 3 });
  assert.equal(fixture.calls[0].options.headers['Idempotency-Key'], 'fixture-idempotency-key');
  fixture.setPreview(true);
  assert.throws(() => store.purchase(product, 'another-key'), /前端测试账户/);
  assert.throws(() => store.report('item', 'fixture report'), /前端测试账户/);
  assert.equal(fixture.calls.length, 1);
});
