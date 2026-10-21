import test from 'node:test';
import assert from 'node:assert/strict';
import { RELEASE_APIS, RELEASE_GITHUB, SOURCE_GITHUB, LEGACY_GITHUB, releaseAssetIdentity, releaseSignatureUrl } from '../src/utils/releaseRepository.ts';
import { fetchReleaseCatalogs, mergeReleaseCatalogs } from '../src/utils/releaseCatalog.ts';
import { compareNexaReleases } from '../src/utils/nexaReleases.ts';
import { loadGithubReleases } from '../src/utils/githubReleases.ts';
import worker from '../worker/index.mjs';

function release(root, tag = 'v2.0.0.beta.1') {
  const name = `Nexa-${tag.replace(/^v/, '')}-win-x64.msi`;
  return { tag_name: tag, name: tag, body: 'notes', published_at: '2026-10-21T00:00:00Z',
    html_url: `${root}/releases/tag/${tag}`,
    assets: [{ name, size: 123, browser_download_url: `${root}/releases/download/${tag}/${name}` }] };
}

test('distribution takes priority over duplicate source tags while keeping historical downloads intact', () => {
  const current = release(RELEASE_GITHUB); const source = release(SOURCE_GITHUB, '2.0.0.beta.1');
  const historical = release(LEGACY_GITHUB, 'v2.0.0.alpha.6');
  const catalog = mergeReleaseCatalogs([[current], [source], [historical]]);
  assert.deepEqual(catalog, [current, historical]);
  assert.equal(catalog[1].assets[0].browser_download_url, historical.assets[0].browser_download_url);
});

test('parallel catalogs tolerate one failed source, preserve priority and fail only when all sources fail', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push(url); assert.ok(options.signal); assert.equal(options.headers['User-Agent'], undefined);
    if (url === RELEASE_APIS[0]) throw new Error('mirror offline');
    return Response.json([release(url === RELEASE_APIS[1] ? SOURCE_GITHUB : LEGACY_GITHUB)]);
  };
  assert.equal((await fetchReleaseCatalogs(fetcher))[0].html_url, release(SOURCE_GITHUB).html_url);
  assert.deepEqual(calls, RELEASE_APIS);
  await assert.rejects(fetchReleaseCatalogs(async () => new Response('', { status: 503 })), /All GitHub/);
  assert.deepEqual(await fetchReleaseCatalogs(async () => Response.json([])), []);
});

test('invalid catalog entries cannot hide the valid fallback release or supply foreign assets', () => {
  const good = release(SOURCE_GITHUB);
  const result = mergeReleaseCatalogs([[
    { ...good, draft: true },
    { ...good, html_url: good.html_url + '-spoof' },
    { ...good, assets: [...good.assets, { ...good.assets[0], browser_download_url: 'https://example.com/payload' }] }
  ]]);
  assert.deepEqual(result, [good]);
});

test('version order ranks stable, numeric Beta, Alpha and CI independently of publication time', () => {
  const tags = ['v2.0.0.alpha.99', 'v2.0.0.beta.2', 'v2.0.0.beta.10', 'v2.0.0', 'v2.0.0.ci.abcdef', 'v2.1.0.alpha.1'];
  assert.deepEqual(tags.map(tag => release(SOURCE_GITHUB, tag)).sort(compareNexaReleases).map(r => r.tag_name),
    ['v2.1.0.alpha.1', 'v2.0.0', 'v2.0.0.beta.10', 'v2.0.0.beta.2', 'v2.0.0.alpha.99', 'v2.0.0.ci.abcdef']);
});

test('download completion accepts all pinned repositories and only the corresponding signature', () => {
  for (const root of [RELEASE_GITHUB, SOURCE_GITHUB, LEGACY_GITHUB, 'https://github.com/PCL-N-Edition/PCL-N']) {
    const { browser_download_url: url, name } = release(root).assets[0];
    assert.deepEqual(releaseAssetIdentity(url), { url, tag: 'v2.0.0.beta.1', name });
    assert.equal(releaseSignatureUrl(url), url + '.asc');
    assert.equal(releaseSignatureUrl(url, url + '.asc'), url + '.asc');
    for (const bad of [url + '?redirect=bad', url + '#fragment', url.replace(root, root + '-spoof'), url.replace('https://github.com/', 'https://github.com@evil.test/'), url.replace(name, 'bad%2Fname')]) {
      assert.equal(releaseAssetIdentity(bad), null, bad);
      assert.equal(releaseSignatureUrl(bad), '');
    }
    assert.equal(releaseSignatureUrl(url, release(LEGACY_GITHUB, 'v2.0.0.alpha.6').assets[0].browser_download_url + '.asc'), '');
    assert.equal(releaseSignatureUrl(url, 'https://example.com/fake.asc'), '');
  }
  assert.equal(releaseAssetIdentity('https://objects.githubusercontent.com/arbitrary'), null);
});

test('Worker caches the unified catalog separately from the old repository-only response', async t => {
  const entries = new Map(); const calls = [];
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  t.after(() => { if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches); else delete globalThis.caches; });
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: {
    async match(key) { return entries.get(key.url)?.clone(); },
    async put(key, response) { entries.set(key.url, response.clone()); }
  }}});
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push(url); assert.equal(options.headers['User-Agent'], 'nexa-web-worker');
    if (url === RELEASE_APIS[0]) return Response.json([release(RELEASE_GITHUB)]);
    if (url === RELEASE_APIS[1]) return Response.json([release(SOURCE_GITHUB)]);
    return Response.json([release(LEGACY_GITHUB, 'v2.0.0.alpha.6')]);
  });
  const request = new Request('https://pcln.top/api/v1/github/releases');
  const first = await worker.fetch(request, {});
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), [release(RELEASE_GITHUB), release(LEGACY_GITHUB, 'v2.0.0.alpha.6')]);
  assert.match([...entries.keys()][0], /catalog=nexacl-source-update-history-v1/);
  assert.match(first.headers.get('cache-control'), /s-maxage=300/);
  assert.equal((await worker.fetch(request, {})).status, 200);
  assert.equal(calls.length, 3);
  entries.clear();
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  const failed = await worker.fetch(request, {});
  assert.equal(failed.status, 502); assert.equal(failed.headers.get('cache-control'), 'no-store');
  assert.equal(entries.size, 0);
});


test('cancelling one page does not cancel a shared catalog request used by another page', async t => {
  let finish; let requests = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    requests++;
    if (String(url) === '/api/v1/github/releases') return new Promise(resolve => { finish = () => resolve(new Response('', { status: 503 })); });
    return Response.json([release(RELEASE_GITHUB)]);
  });
  const controller = new AbortController();
  const first = loadGithubReleases(controller.signal);
  const second = loadGithubReleases();
  const cancelled = assert.rejects(first, { name: 'AbortError' });
  controller.abort(); finish();
  await cancelled;
  assert.deepEqual(await second, [release(RELEASE_GITHUB)]);
  assert.equal(requests, 4);
});

test('release proxy migration preserves authenticated API and Auth routing boundaries', async () => {
  const calls = [];
  const env = { LAUNCHER_GATEWAY_TOKEN: 'test-gateway', API: { async fetch(request) {
    calls.push(request); return Response.json({ ok: true });
  } }, AUTH: { async fetch() { return new Response('auth'); } } };
  const headers = { 'x-nexa-gateway-token': 'spoof', 'x-nexa-client-certificate': 'spoof', cookie: 'session=test' };
  assert.equal((await worker.fetch(new Request('https://pcln.top/api/v1/launcher/plugins', { headers }), env)).status, 403);
  assert.equal(calls.length, 0);
  const request = new Request('https://pcln.top/api/v1/launcher/plugins', { headers });
  Object.defineProperty(request, 'cf', { value: { tlsClientAuth: { certPresented: '1', certVerified: 'SUCCESS', certRevoked: '0', certFingerprintSHA256: 'a'.repeat(64) } } });
  assert.equal((await worker.fetch(request, env)).status, 200);
  assert.equal(calls[0].headers.get('x-nexa-gateway-token'), 'test-gateway');
  assert.equal(calls[0].headers.get('x-nexa-client-certificate'), 'a'.repeat(64));
  assert.equal(calls[0].headers.get('cookie'), null);
  await worker.fetch(new Request('https://pcln.top/api/v1/plugins', { headers }), env);
  assert.equal(calls[1].headers.get('x-nexa-gateway-token'), null);
  assert.equal(calls[1].headers.get('cookie'), 'session=test');
  assert.equal(await (await worker.fetch(new Request('https://pcln.top/auth/session'), env)).text(), 'auth');
});
