import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { en, zh, homeCopy } from '../src/views/cloud/homeContent.ts';
import { normalizeLanguage, getInitialLanguage, getStoredLanguage, persistLanguage } from '../src/languages/language.ts';

const CJK = /[\u3400-\u9fff]/;
// Technical names and product labels that are the same in both languages.
const SHARED_LATIN = new Set(['NexaCL 2.0 Alpha', 'MRPACK', 'CurseForge ZIP', 'Forge / NeoForge / OptiFine', 'Alpha', 'PCL N 1.4.x']);
// Names of internal building blocks. They mean nothing to players and must not reach the homepage.
const INTERNAL_TERMS = /\b(XSR|NativeAOT|Native AOT|PXML|UI\.Next|Sidecar|Avalonia|\.NET|JVM|P\/Invoke|keyring)\b/i;

function leaves(value, path = '') {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'number') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, `${path}[${index}]`));
  return Object.entries(value).flatMap(([key, item]) => leaves(item, path ? `${path}.${key}` : key));
}

function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, shape(item)]));
  return typeof value;
}

test('English and Chinese homepage copy have exactly the same structure', () => {
  assert.deepEqual(shape(en), shape(zh));
});

test('Homepage copy has no empty strings and states the same numbers in both languages', () => {
  for (const [path, value] of [...leaves(en), ...leaves(zh)]) if (typeof value === 'string') assert.ok(value.trim().length > 0, `${path} is empty`);
  assert.deepEqual(en.stats.items.map(item => item.value), zh.stats.items.map(item => item.value));
  assert.deepEqual(en.status.rows.map(row => row.state), zh.status.rows.map(row => row.state));
});

test('English copy contains no Chinese, and Chinese copy is translated rather than left in English', () => {
  for (const [path, value] of leaves(en)) if (typeof value === 'string') assert.ok(!CJK.test(value), `en ${path} contains Chinese`);
  // `.state` holds a CSS class name (done / wip / later), not visible copy.
  for (const [path, value] of leaves(zh)) if (typeof value === 'string' && !path.endsWith('.state') && !CJK.test(value)) assert.ok(SHARED_LATIN.has(value), `zh ${path} was not translated: ${value}`);
});

test('Homepage copy speaks to players and never names internal building blocks', () => {
  for (const [path, value] of [...leaves(en), ...leaves(zh)]) if (typeof value === 'string') assert.ok(!INTERNAL_TERMS.test(value), `${path} uses internal jargon: ${value}`);
});

test('Every copy key the template reads exists, and no copy goes unused', () => {
  // Copy is read as `c.x` in the template and as `c.value.x` in the script (SEO), so scan both.
  const source = readFileSync(new URL('../src/views/cloud/Home.vue', import.meta.url), 'utf8').split('<style')[0];
  const referenced = [...new Set([...source.matchAll(/\bc\.(?:value\.)?([A-Za-z_][\w.]*(?:\[\d+\](?:\.[A-Za-z_]\w*)*)*)/g)].map(match => match[1]))];
  assert.ok(referenced.length > 20, 'the page should read its copy from c.*');
  const resolve = (path) => path.replace(/\[(\d+)\]/g, '.$1').split('.').reduce((node, key) => (node == null ? undefined : node[key]), en);
  for (const path of referenced) assert.notEqual(resolve(path), undefined, `the page reads c.${path}, which does not exist`);
  const covered = (leaf) => referenced.some(path => leaf === path || leaf.startsWith(`${path}.`) || leaf.startsWith(`${path}[`));
  for (const [leaf] of leaves(en)) assert.ok(covered(leaf), `copy "${leaf}" is not used by the homepage`);
});

test('homeCopy follows the locale and falls back to English', () => {
  assert.equal(homeCopy('zh'), zh);
  assert.equal(homeCopy('en'), en);
  assert.equal(homeCopy('fr'), en);
});

test('Language values normalize to the two shipped languages', () => {
  for (const [input, expected] of [['zh-CN', 'zh'], ['zh_TW', 'zh'], ['cn', 'zh'], ['en-GB', 'en'], ['EN', 'en'], ['fr-FR', 'en'], [undefined, 'en']]) assert.equal(normalizeLanguage(input), expected, String(input));
});

test('A saved language choice wins over the browser language, and broken storage is harmless', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const define = (value) => Object.defineProperty(globalThis, 'localStorage', { value, configurable: true, writable: true });
  try {
    const store = new Map();
    define({ getItem: (key) => store.get(key) ?? null, setItem: (key, value) => { store.set(key, value); } });
    assert.equal(getStoredLanguage(), undefined);
    persistLanguage('zh');
    assert.equal(getStoredLanguage(), 'zh');
    assert.equal(getInitialLanguage(), 'zh');
    store.set('nexa:lang', 'klingon');
    assert.equal(getStoredLanguage(), undefined, 'unknown stored values are ignored');
    define({ getItem() { throw new Error('storage disabled'); }, setItem() { throw new Error('storage disabled'); } });
    assert.equal(getStoredLanguage(), undefined);
    assert.doesNotThrow(() => persistLanguage('en'));
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original); else delete globalThis.localStorage;
  }
});
