import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, appendFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const command = process.argv[2];
const sha = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Exact release SHA required');

if (command === 'prepare') {
  const files = {
    '/plans': 'index.html', '/pricing': 'index.html', '/legal/refunds': 'index.html', '/checkout/result': 'index.html',
    '/legal/current/refunds.zh-CN.md': 'legal/current/refunds.zh-CN.md',
    '/legal/current/refunds.en.md': 'legal/current/refunds.en.md'
  };
  const assets = (await readdir('dist/assets')).filter(name => /^(PublicPlans|SubscriptionPricing|LegalDocs|CheckoutResult|index)-.*\.(js|css)$/.test(name));
  assert.ok(assets.some(name => /^PublicPlans-.*\.js$/.test(name)), 'Missing public pricing bundle');
  assert.ok(assets.some(name => /^CheckoutResult-.*\.js$/.test(name)), 'Missing checkout return bundle');
  assert.ok(assets.some(name => /^SubscriptionPricing-.*\.js$/.test(name)), 'Missing subscription pricing bundle');
  for (const name of assets) files[`/assets/${name}`] = `assets/${name}`;
  const hashes = {};
  for (const [path, file] of Object.entries(files)) hashes[path] = digest(await readFile(`dist/${file}`));
  await writeFile('dist/public-release.json', JSON.stringify({ commit: sha, hashes }) + '\n');
} else if (command === 'verify') {
  const expected = JSON.parse(await readFile('dist/public-release.json', 'utf8'));
  assert.equal(expected.commit, sha);
  // Verification is deliberately limited to this site's own released assets.
  const origin = 'https://pcln.top';
  async function get(path) {
    const response = await fetch(`${origin}${path}?release=${sha}`, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-cache' } });
    const diagnosticHeaders = Object.fromEntries(['server', 'content-type', 'cf-mitigated', 'cf-ray', 'via', 'x-cache']
      .map(name => [name, response.headers.get(name)]).filter(([, value]) => value));
    assert.equal(response.status, 200, `${origin}${path}: HTTP ${response.status}; response=${JSON.stringify(diagnosticHeaders)}`);
    return Buffer.from(await response.arrayBuffer());
  }
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      assert.deepEqual(JSON.parse((await get('/public-release.json')).toString()), expected, 'Published commit differs');
      for (const [path, hash] of Object.entries(expected.hashes)) assert.equal(digest(await get(path)), hash, `${path}: published bytes differ`);
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  if (lastError) {
    const detail = String(lastError.message).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
    console.error(`::error title=Online public release verification::${detail}`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `Deployment completed for ${sha}, but online verification failed:\n\n\`\`\`text\n${lastError.message}\n\`\`\`\n`);
    throw lastError;
  }
  const receipt = `Published and verified ${sha}\n${origin}/plans\n${origin}/legal/refunds\nRefund documents and page bundles match the release SHA-256 manifest.\n`;
  console.log(receipt);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, receipt);
} else throw new Error('Expected prepare or verify');
