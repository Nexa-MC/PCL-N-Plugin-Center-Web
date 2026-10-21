import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nexaChannel, releaseAssets, loadNexaCatalog } from '../src/utils/nexaReleases.ts';
import { RELEASE_GITHUB, LEGACY_GITHUB, RELEASE_API, isReleaseAsset } from '../src/utils/releaseRepository.ts';

test('Nexa dotted channels never label Alpha or CI as a stable release',()=>{
  for(const [tag,expected] of [['v2.0.0.alpha.1','alpha'],['2.0.0.beta.2','beta'],['2.0.0.ci.abcdef','ci'],['2.0.0','release'],['v1.3.20-beta',null],['2.0.0.alpha.0',null],['2.0.0-bogus',null]]) assert.equal(nexaChannel(tag),expected);
});
test('Every platform uses real matching published assets, never invented filenames',()=>{
  const release=JSON.parse(readFileSync(new URL('../public/nexa-releases.json',import.meta.url))).releases[0];
  let count=0;
  for(const platform of ['win','osx','linux']) for(const arch of ['x64','arm64']) {
    const assets=releaseAssets(release,platform,arch);
    assert.ok(assets.length>0,`${platform}-${arch} has published downloads`);
    assert.ok(assets.some(a=>a.name.includes('.portable.')));
    count+=assets.length;
  }
  assert.equal(count,18);
  assert.deepEqual(releaseAssets({...release,assets:[]},'win','x64'),[]);
  const tampered={...release,assets:release.assets.map(a=>({...a,browser_download_url:'https://example.invalid/payload'}))};
  assert.deepEqual(releaseAssets(tampered,'win','x64'),[]);
});


test('live releases revalidate, coalesce requests, isolate snapshots and respect cancellation', async t => {
  let now = 1000000; let calls = 0; let offline = false; let tag = '2.0.0.alpha.99';
  const makeRelease = () => ({ tag_name: tag, name: tag, body: 'Fresh release notes', published_at: '2026-09-09T00:00:00Z', html_url: `https://github.com/PCL-N-Edition/PCL-N/releases/tag/${tag}`, assets: [] });
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async url => {
    calls++;
    if (String(url) === '/api/v1/github/releases' || String(url).startsWith('https://api.github.com/')) {
      if (offline) return new Response('', {status: 503});
      return Response.json([makeRelease(), {...makeRelease(), draft:true, tag_name:'2.0.0.alpha.1000'}]);
    }
    assert.equal(String(url), '/nexa-releases.json');
    return Response.json({releases:[{...makeRelease(),body:'Saved notes'}]});
  });
  const [first, same] = await Promise.all([loadNexaCatalog(), loadNexaCatalog()]);
  assert.equal(calls,1); assert.equal(first.source,'github'); assert.equal(first.releases.length,1); assert.equal(same.releases[0].tag_name,tag);
  now += 61000; tag = '2.0.0.alpha.100';
  assert.equal((await loadNexaCatalog()).releases[0].tag_name,tag); assert.equal(calls,2);
  now += 61000; offline = true;
  const fallback = await loadNexaCatalog(); assert.equal(fallback.source,'snapshot'); assert.equal(fallback.releases[0].body,'Saved notes');
  assert.equal(calls, 7); // 代理失败后尝试三个 GitHub 目录，再读取静态快照。
  const controller = new AbortController(); controller.abort(); const previous = calls;
  await assert.rejects(loadNexaCatalog(controller.signal), {name:'AbortError'}); assert.equal(calls,previous);
});


test('Alpha 4 and 5 renamed assets and legacy assets resolve on all six targets', () => {
  const formats = { win: ['setup.exe', 'msi', 'portable.zip'], osx: ['dmg', 'portable.tar.gz'], linux: ['deb', 'rpm', 'AppImage', 'portable.tar.gz'] };
  for (const [tag, brand] of [['v2.0.0.alpha.3', 'PCL-Nexa'], ['v2.0.0.alpha.4', 'Nexa'], ['v2.0.0.alpha.5', 'Nexa']]) {
    const assets = Object.entries(formats).flatMap(([platform, extensions]) => ['x64', 'arm64'].flatMap(arch => extensions.flatMap(ext => {
      const name = `${brand}-${tag.slice(1)}-${platform}-${arch}.${ext}`;
      const url = `https://github.com/PCL-N-Edition/PCL-N/releases/download/${tag}/${name}`;
      return [{ name, browser_download_url: url, size: 123 }, { name: name + '.asc', browser_download_url: url + '.asc', size: 123 }];
    })));
    const release = { tag_name: tag, assets };
    for (const [platform, extensions] of Object.entries(formats)) for (const arch of ['x64', 'arm64']) {
      const actual = releaseAssets(release, platform, arch);
      assert.equal(actual.length, extensions.length, `${tag} ${platform}-${arch}`);
      assert.deepEqual(actual.map(a => a.name), extensions.map(ext => `${brand}-${tag.slice(1)}-${platform}-${arch}.${ext}`));
    }
    assert.deepEqual(releaseAssets(release, 'win', 'x86'), []);
    assert.deepEqual(releaseAssets({ ...release, assets: assets.map(a => ({ ...a, browser_download_url: a.browser_download_url + '?redirect=bad' })) }, 'win', 'x64'), []);
  }
});

test('renamed artifacts take precedence without duplicating formats', () => {
  const tag = 'v2.0.0.alpha.5';
  const assets = ['PCL-Nexa', 'Nexa'].map(brand => {
    const name = `${brand}-2.0.0.alpha.5-win-x64.msi`;
    return { name, browser_download_url: `https://github.com/PCL-N-Edition/PCL-N/releases/download/${tag}/${name}`, size: 1 };
  });
  assert.deepEqual(releaseAssets({ tag_name: tag, assets }, 'win', 'x64'), [assets[1]]);
});

test('published Alpha 6 resolves all 18 packages after the repository transfer', () => {
  const release = JSON.parse(readFileSync(new URL('../public/nexa-releases.json', import.meta.url))).releases.find(r => r.tag_name === 'v2.0.0.alpha.6');
  assert.ok(release, 'the outage fallback must include the published Alpha 6');
  assert.equal(release.html_url, `${LEGACY_GITHUB}/releases/tag/${release.tag_name}`);
  const formats = { win: ['setup.exe', 'msi', 'portable.zip'], osx: ['dmg', 'portable.tar.gz'], linux: ['deb', 'rpm', 'AppImage', 'portable.tar.gz'] };
  for (const [platform, extensions] of Object.entries(formats)) for (const architecture of ['x64', 'arm64']) {
    const assets = releaseAssets(release, platform, architecture);
    assert.deepEqual(assets.map(a => a.name), extensions.map(ext => `Nexa-2.0.0.alpha.6-${platform}-${architecture}.${ext}`));
    for (const asset of assets) assert.equal(asset.browser_download_url, `${LEGACY_GITHUB}/releases/download/${release.tag_name}/${asset.name}`);
  }
  const sums = release.assets.find(a => a.name === 'SHA256SUMS');
  assert.ok(sums && isReleaseAsset(sums.browser_download_url, release.tag_name, sums.name));
  assert.equal(isReleaseAsset(sums.browser_download_url + '?redirect=bad', release.tag_name, sums.name), false);
  assert.equal(isReleaseAsset(sums.browser_download_url.replace(release.tag_name, 'v2.0.0.alpha.5'), release.tag_name, sums.name), false);
  assert.deepEqual(releaseAssets({ ...release, assets: release.assets.map(a => ({ ...a, browser_download_url: a.browser_download_url.replace('Nexa-MC', 'Other-Owner') })) }, 'win', 'x64'), []);
});

test('live catalogs accept the current and historical repository but reject lookalikes', async t => {
  t.mock.method(Date, 'now', () => 3000000);
  const makeRelease = (root, tag = 'v2.0.0.alpha.6') => ({ tag_name: tag, name: tag, published_at: '2026-10-11T01:27:12Z', html_url: `${root}/releases/tag/${tag}`, assets: [] });
  t.mock.method(globalThis, 'fetch', async url => {
    assert.ok(String(url) === '/api/v1/github/releases' || String(url) === RELEASE_API);
    return Response.json([
      makeRelease(RELEASE_GITHUB), makeRelease('https://github.com/PCL-N-Edition/PCL-N', 'v2.0.0.alpha.5'),
      makeRelease(RELEASE_GITHUB + '-malicious'), makeRelease('https://github.com/Other-Owner/PCL-N'),
      { ...makeRelease(RELEASE_GITHUB), html_url: `${RELEASE_GITHUB}/releases/tag/v2.0.0.alpha.5` },
      { ...makeRelease(RELEASE_GITHUB), draft: true }
    ]);
  });
  const catalog = await loadNexaCatalog();
  assert.equal(catalog.source, 'github');
  assert.deepEqual(catalog.releases.map(r => r.tag_name), ['v2.0.0.alpha.6', 'v2.0.0.alpha.5']);
});

test('a temporarily empty live catalog falls back to saved published releases', async t => {
  t.mock.method(Date, 'now', () => 4000000);
  const saved = JSON.parse(readFileSync(new URL('../public/nexa-releases.json', import.meta.url)));
  t.mock.method(globalThis, 'fetch', async url => {
    if (String(url) === '/nexa-releases.json') return Response.json(saved);
    return Response.json([]);
  });
  const catalog = await loadNexaCatalog();
  assert.equal(catalog.source, 'snapshot');
  assert.ok(catalog.releases.length > 0);
});
