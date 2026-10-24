// Deploy only the existing anonymous machine gateway. No zone security settings
// or Secret values are read/changed. The owner selected botonly.pcln.top.
import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const origin = 'https://botonly.pcln.top';
export function validateNativeIngress(settings, domains) {
  if (settings.bindings?.length !== 1 || settings.bindings[0].type !== 'service' || settings.bindings[0].name !== 'API' || settings.bindings[0].service !== 'nexa-api') throw new Error('existing_ingress_binding_drift');
  if (!Array.isArray(domains) || domains.some(row => row.hostname === 'botonly.pcln.top' && row.service !== 'nexa-telemetry')) throw new Error('botonly_existing_domain_conflict');
  if (domains.some(row => row.service === 'nexa-telemetry' && row.hostname !== 'botonly.pcln.top')) throw new Error('existing_ingress_domain_drift');
}
async function deploy() {
  if (process.env.GITHUB_ACTIONS !== 'true' || !token || !/^[a-f0-9]{32}$/.test(account || '')) throw new Error('ingress_deployment_context_missing');
  const api = async path => {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) throw new Error('ingress_metadata_read_' + response.status);
    const value = await response.json(); if (!value.success) throw new Error('ingress_metadata_invalid'); return value.result;
  };
  const settings = await api('workers/scripts/nexa-telemetry/settings');
  const domains = await api('workers/domains');
  validateNativeIngress(settings, domains);
  let output;
  try { output = execFileSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', 'wrangler.telemetry.jsonc'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } }); }
  catch { throw new Error('botonly_worker_deploy_failed'); }
  const version = output.match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1] || null;
  if (!(await api('workers/domains')).some(row => row.hostname === 'botonly.pcln.top' && row.service === 'nexa-telemetry')) throw new Error('botonly_domain_readback_failed');
  console.log(JSON.stringify({ step: 'botonly_gateway_deployed', commit: process.env.GITHUB_SHA, version, origin, websiteSecurityChanged: false, privateKeyStoredOnGateway: false }));
  let last = {};
  for (let attempt = 0; attempt < 12; attempt++) {
    const probe = async (path, signature) => {
      try {
        const response = await fetch(origin + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(signature ? { 'x-waffo-signature': 'invalid-ingress-readiness-probe' } : {}) }, body: signature ? '{}' : '[]', redirect: 'manual', signal: AbortSignal.timeout(10000) });
        return { status: response.status, marker: response.headers.get('x-nexa-webhook'), json: response.headers.get('content-type')?.includes('json') || false, challenge: response.headers.get('cf-mitigated'), ray: response.headers.get('cf-ray') };
      } catch { return { status: 0 }; }
    };
    const [telemetry, webhook] = await Promise.all([probe('/v1/events', false), probe('/webhooks/wp_wh/live', true)]);
    last = { telemetry, webhook };
    if (telemetry.status === 400 && telemetry.json && webhook.status === 401 && webhook.marker === 'waffo-live') {
      console.log(JSON.stringify({ step: 'botonly_ingress_verified', telemetryStatus: 400, webhookStatus: 401, eventsInserted: false, transactionExecuted: false }));
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\nGateway commit: ${process.env.GITHUB_SHA}\n\nTelemetry: ${origin}/v1/events (invalid empty payload rejected400).\n\nLive webhook: ${origin}/webhooks/wp_wh/live (invalid signature rejected401).\n\nNo website security settings, real events or transactions changed.\n`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log(`::notice title=botonly external probes::${JSON.stringify(last)}`);
  throw new Error(`botonly_ingress_unverified_telemetry_${last.telemetry?.status}_webhook_${last.webhook?.status}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) deploy().catch(error => { console.log(`::error title=Independent machine ingress blocked::${/^[a-z0-9_]+$/.test(error.message) ? error.message : 'ingress_deployment_failed'}`); process.exitCode = 2; });
