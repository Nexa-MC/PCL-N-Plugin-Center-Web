import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const publicFile = path => new URL(`../public/${path}`, import.meta.url);
const pngSize = path => {
  const bytes = readFileSync(publicFile(path));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

test('NexaCL icon sizes match their browser declarations', () => {
  for (const size of [16, 32, 48, 180, 192, 512]) {
    assert.deepEqual(pngSize(`icons/nexacl-${size}.png`), [size, size]);
  }
  assert.deepEqual(pngSize('pcln.png'), [256, 256]);
  const ico = readFileSync(publicFile('favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.deepEqual([0, 1, 2].map(i => ico[6 + i * 16]), [16, 32, 48]);
});

test('favicon and home-screen references point to existing assets', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/<link\b[^>]*href="([^"]+)"/g)) {
    assert.ok(existsSync(publicFile(match[1].replace(/^\//, '').split('?')[0])), match[1]);
  }
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /rel="manifest"/);
  const manifest = JSON.parse(readFileSync(publicFile('site.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'NexaCL');
  for (const icon of manifest.icons) {
    assert.equal(pngSize(icon.src.replace(/^\//, '')).join('x'), icon.sizes);
    assert.equal(icon.purpose, 'any');
  }
});
