// Owner explicitly approved disabling zone-wide basic Bot Fight Mode, followed
// by browser-check exceptions only on these two botonly POST endpoints.
import { writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const EXPRESSION = '(http.host eq "botonly.pcln.top" and http.request.method eq "POST" and http.request.uri.path in {"/v1/events" "/webhooks/wp_wh/live"})';
export const REF = 'nexa_botonly_machine_post_v1';
const description = 'Nexa botonly signed webhook and anonymous telemetry';
const exception = { ref: REF, description, expression: EXPRESSION, action: 'skip', action_parameters: { products: ['bic', 'securityLevel'] }, enabled: true, logging: { enabled: true } };
const reject = code => { throw new Error(code); };
const canonical = value => JSON.stringify(Object.fromEntries(Object.keys(value || {}).sort().map(key => [key, Array.isArray(value[key]) ? [...value[key]].sort() : value[key]])));
const own = rule => rule.ref === REF || rule.description === description;
const matches = rule => rule.enabled !== false && rule.expression === EXPRESSION && rule.action === 'skip' && canonical(rule.action_parameters) === canonical(exception.action_parameters);

export async function configureBotonlyEdge({ approved, account, api, backup, log = () => {} }) {
  if (approved !== true || !/^[a-f0-9]{32}$/.test(account || '')) reject('explicit_basic_bot_disable_approval_missing');
  const zones = await api('zones?name=pcln.top&account.id=' + account), zone = zones.find(row => row.name === 'pcln.top' && row.account?.id === account);
  if (!zone || !/^[a-f0-9]{32}$/.test(zone.id)) reject('owned_zone_not_found');
  const base = `zones/${zone.id}`, entrypoint = `${base}/rulesets/phases/http_request_firewall_custom/entrypoint`;
  const bot = await api(base + '/bot_management');
  if (typeof bot?.fight_mode !== 'boolean') reject('basic_bot_mode_unverified');
  const browser = await api(base + '/settings/browser_check'), security = await api(base + '/settings/security_level');
  if (typeof browser?.value !== 'string' || typeof security?.value !== 'string') reject('existing_zone_settings_unverified');
  const before = await api(entrypoint);
  if (before && (!before.id || !Array.isArray(before.rules))) reject('existing_custom_ruleset_unverified');
  const owned = (before?.rules || []).filter(own);
  if (owned.length > 1 || owned.some(rule => !matches(rule))) reject('botonly_existing_exception_conflict');
  if (typeof backup !== 'function') reject('edge_backup_required');
  await backup({ zoneId: zone.id, botManagement: bot, browserCheck: browser, securityLevel: security, ruleset: before, desiredException: exception });

  if (bot.fight_mode) await api(base + '/bot_management', 'PUT', { fight_mode: false });
  if ((await api(base + '/bot_management'))?.fight_mode !== false) reject('basic_bot_disable_readback_failed');
  log({ step: 'basic_bot_fight_mode_disabled', changed: bot.fight_mode, zone: 'pcln.top', onlySubmittedSetting: 'fight_mode' });

  if (!owned.length) {
    if (before) await api(`${base}/rulesets/${before.id}/rules`, 'POST', { ...exception, ...(before.rules[0]?.id ? { position: { before: before.rules[0].id } } : {}) });
    else await api(base + '/rulesets', 'POST', { name: 'Nexa machine ingress', kind: 'zone', phase: 'http_request_firewall_custom', rules: [exception] });
  }
  const current = await api(entrypoint), actual = current?.rules?.filter(own);
  if (actual?.length !== 1 || !matches(actual[0])) reject('botonly_exception_readback_failed');
  const unrelated = current.rules.filter(rule => !own(rule));
  if (JSON.stringify(unrelated) !== JSON.stringify((before?.rules || []).filter(rule => !own(rule)))) reject('unrelated_custom_rules_changed');
  const afterBrowser = await api(base + '/settings/browser_check'), afterSecurity = await api(base + '/settings/security_level');
  if (afterBrowser.value !== browser.value || afterSecurity.value !== security.value) reject('unrelated_zone_settings_changed');
  log({ step: 'botonly_exception_configured', changed: !owned.length, expression: EXPRESSION, ruleId: actual[0].id, browserCheck: afterBrowser.value, securityLevel: afterSecurity.value, otherWafRulesChanged: false });
  return { basicBotFightMode: false, ruleId: actual[0].id, expression: EXPRESSION };
}

export async function verifyBotonlyEdge({ send = fetch, attempts = 6, pause = () => new Promise(resolve => setTimeout(resolve, 5000)) } = {}) {
  let result;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const probe = async (path, signature) => {
      try {
        const response = await send('https://botonly.pcln.top' + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(signature ? { 'x-waffo-signature': 'invalid-approved-edge-probe' } : {}) }, body: signature ? '{}' : '[]', redirect: 'manual', signal: AbortSignal.timeout(10000) });
        return { status: response.status, marker: response.headers.get('x-nexa-webhook'), json: response.headers.get('content-type')?.includes('json') || false, challenge: response.headers.get('cf-mitigated'), ray: response.headers.get('cf-ray') };
      } catch { return { status: 0 }; }
    };
    const [telemetry, webhook] = await Promise.all([probe('/v1/events', false), probe('/webhooks/wp_wh/live', true)]);
    result = { telemetry, webhook };
    if (telemetry.status === 400 && telemetry.json && webhook.status === 401 && webhook.marker === 'waffo-live') return { step: 'botonly_edge_verified', telemetryStatus: 400, webhookStatus: 401, eventsInserted: false, transactionExecuted: false };
    if (attempt + 1 < attempts) await pause();
  }
  const error = new Error(`botonly_edge_unverified_telemetry_${result?.telemetry?.status}_webhook_${result?.webhook?.status}`);
  error.evidence = result; throw error;
}
async function main() {
  const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, RUNNER_TEMP: temporary } = process.env;
  if (!token || !temporary) reject('edge_configuration_context_missing');
  const api = async (path, method = 'GET', body) => {
    const response = await fetch('https://api.cloudflare.com/client/v4/' + path, { method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (response.status === 404 && method === 'GET' && path.endsWith('/entrypoint')) return null;
    if (!response.ok) {
      const scope = path.endsWith('/bot_management') ? 'bot_management' : path.includes('/rulesets') ? 'custom_rules' : 'zone_settings';
      reject(`cloudflare_${scope}_${method.toLowerCase()}_${response.status}`);
    }
    const result = await response.json(); if (!result.success) reject('cloudflare_edge_operation_failed'); return result.result;
  };
  await configureBotonlyEdge({ approved: process.env.BASIC_BOT_DISABLE_APPROVED === 'true', account, api, backup: snapshot => writeFile(resolve(temporary, 'botonly-edge-before.json'), JSON.stringify(snapshot), { mode: 0o600 }), log: value => console.log(JSON.stringify(value)) });
  const proof = await verifyBotonlyEdge(); console.log(JSON.stringify(proof));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, '\nOwner-approved basic Bot Fight Mode disabled for pcln.top. Browser/security-level exception applies only to POST botonly.pcln.top/v1/events and /webhooks/wp_wh/live. Other WAF rules and zone settings were read back unchanged. External telemetry400 and invalid-signature401 verified. No real event or transaction created.\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  if (error.evidence) console.log(`::notice title=External edge admission::${JSON.stringify(error.evidence)}`);
  console.log(`::error title=Approved botonly edge configuration blocked::${/^[a-z0-9_]+$/.test(error.message) ? error.message : 'edge_configuration_failed'}`); process.exitCode = 2;
});
