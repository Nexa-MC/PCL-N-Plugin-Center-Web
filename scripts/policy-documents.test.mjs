import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const page = await readFile(new URL('src/views/cloud/LegalDocs.vue', root), 'utf8');
const documentPattern = /\{ key: '([^']+)', title: '[^']+', version: '([^']+)', effective: '([^']+)', hash: '([a-f0-9]{64})', file: '([^']+)'/g;
const documents = Array.from(page.matchAll(documentPattern), ([, key, version, effective, hash, file]) => ({ key, version, effective, hash, file }));

test('legal download bytes match published version, date and SHA-256 for every current document', async t => {
  assert.deepEqual(documents.map(d => d.key).sort(), ['privacy', 'publisher', 'refunds', 'terms']);
  for (const doc of documents) await t.test(doc.key, async () => {
    assert.match(doc.file, /^\/legal\/current\/[a-z]+\.zh-CN\.md$/);
    const bytes = await readFile(new URL('public' + doc.file, root));
    const content = bytes.toString('utf8');
    assert.equal(sha256(bytes), doc.hash, 'original download bytes must match the displayed legal hash');
    assert.equal(content.match(/\*\*版本：([^*]+)\*\*/)?.[1], doc.version);
    const date = content.match(/\*\*生效日期：(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日\*\*/);
    assert.ok(date, 'an effective date must be included in the actual document');
    assert.equal([date[1], date[2].padStart(2, '0'), date[3].padStart(2, '0')].join('-'), doc.effective);
  });
});

test('1.1 account entry version follows terms and privacy while supplemental policies remain 1.0', async () => {
  const source = await readFile(new URL('src/api/platform.ts', root), 'utf8');
  const version = source.match(/export const POLICY_VERSION = '([^']+)'/)?.[1];
  assert.equal(version, '1.1');
  assert.equal(documents.find(d => d.key === 'terms').version, version);
  assert.equal(documents.find(d => d.key === 'privacy').version, version);
  assert.equal(documents.find(d => d.key === 'publisher').version, '1.0');
  assert.equal(documents.find(d => d.key === 'refunds').version, '1.0');
});

test('1.0 archives preserve the original accepted document bytes and are reachable from the index', async t => {
  const oldHashes = {
    terms: '13665d991a4ca5eba6f82c25a76d81a313c4b6e555ade65da9bea2a2d15f11a1',
    privacy: 'a0acdf32c4f651783e93ad54bc86f7244b94fbb93dcdb4ad22e1cf983d0f8009'
  };
  for (const [kind, expected] of Object.entries(oldHashes)) await t.test(kind, async () => {
    const path = `/legal/archive/1.0/${kind}.zh-CN.md`;
    const bytes = await readFile(new URL('public' + path, root));
    assert.equal(sha256(bytes), expected, 'an archived acceptance must always refer to the original content');
    assert.equal(bytes.toString('utf8').match(/\*\*版本：([^*]+)\*\*/)?.[1], '1.0');
    assert.ok(page.includes(`href="${path}"`), 'the original document must remain available to users');
  });
});
