import test from 'node:test';
import assert from 'node:assert/strict';
import { configureBotonlyEdge, verifyBotonlyEdge, EXPRESSION, REF } from './configure-botonly-edge.mjs';
const account = 'a'.repeat(32), zone = 'b'.repeat(32);
function fixture({ rules = [], bot = { fight_mode: true, enable_js: true } } = {}) {
  const calls = [], logs = [], backups = [];
  let state = { id: 'existing-ruleset', rules: structuredClone(rules) };
  const api = async (path, method = 'GET', body) => {
    calls.push({ path, method, body: structuredClone(body) });
    if (path.startsWith('zones?')) return [{ id: zone, name: 'pcln.top', account: { id: account } }];
    if (path.endsWith('/bot_management')) { if (method === 'PUT') Object.assign(bot, body); return structuredClone(bot); }
    if (path.endsWith('/settings/browser_check')) return { value: 'on' };
    if (path.endsWith('/settings/security_level')) return { value: 'medium' };
    if (path.endsWith('/entrypoint')) return structuredClone(state);
    if (path.endsWith('/rules') && method === 'POST') { const { position, ...rule } = body; state.rules.unshift({ ...rule, id: 'nexa-exception' }); return {}; }
    assert.fail('Unexpected configuration operation');
  };
  return { calls, logs, backups, bot, state: () => state, args: { account, approved: true, api, backup: value => backups.push(structuredClone(value)), log: value => logs.push(value) } };
}
test('an unapproved invocation cannot even read the zone', async () => {
  const f = fixture(); await assert.rejects(configureBotonlyEdge({ ...f.args, approved: false }), { message: 'explicit_basic_bot_disable_approval_missing' }); assert.equal(f.calls.length, 0);
});
test('approved change disables only basic mode and adds an exact two-route botonly exception', async () => {
  const f = fixture(); await configureBotonlyEdge(f.args);
  assert.equal(f.bot.fight_mode, false); assert.equal(f.bot.enable_js, true);
  assert.deepEqual(f.calls.find(row => row.method === 'PUT').body, { fight_mode: false });
  assert.equal(f.backups[0].botManagement.fight_mode, true);
  const rule = f.state().rules[0]; assert.equal(rule.ref, REF);
  assert.equal(rule.expression, '(http.host eq "botonly.pcln.top" and http.request.method eq "POST" and http.request.uri.path in {"/v1/events" "/webhooks/wp_wh/live"})');
  assert.deepEqual(rule.action_parameters, { products: ['bic', 'securityLevel'] });
  assert.equal(f.logs.at(-1).browserCheck, 'on'); assert.equal(f.logs.at(-1).securityLevel, 'medium');
  const writes = f.calls.filter(row => row.method !== 'GET').length;
  await configureBotonlyEdge(f.args); assert.equal(f.calls.filter(row => row.method !== 'GET').length, writes);
});
test('existing unrelated WAF rules are retained exactly and conflicting owned rules stop before changes', async () => {
  const other = { id: 'other', action: 'block', expression: 'http.request.uri.path eq "/private"', enabled: true };
  const f = fixture({ rules: [other] }); await configureBotonlyEdge(f.args);
  assert.deepEqual(f.state().rules[1], other); assert.deepEqual(f.calls.find(row => row.method === 'POST').body.position, { before: 'other' });
  const conflict = fixture({ rules: [{ ref: REF, expression: 'true', action: 'skip', action_parameters: { ruleset: 'current' } }] });
  await assert.rejects(configureBotonlyEdge(conflict.args), { message: 'botonly_existing_exception_conflict' });
  assert.ok(conflict.calls.every(row => row.method === 'GET')); assert.equal(conflict.bot.fight_mode, true);
});
test('unknown protection state or denied mode write cannot be reported as success', async () => {
  const unknown = fixture({ bot: {} }); await assert.rejects(configureBotonlyEdge(unknown.args), { message: 'basic_bot_mode_unverified' }); assert.ok(unknown.calls.every(row => row.method === 'GET'));
  const f = fixture(), original = f.args.api;
  f.args.api = async (path, method, body) => { if (method === 'PUT') throw new Error('cloudflare_bot_management_put_403'); return original(path, method, body); };
  await assert.rejects(configureBotonlyEdge(f.args), { message: 'cloudflare_bot_management_put_403' });
  assert.equal(f.bot.fight_mode, true); assert.equal(f.logs.length, 0); assert.equal(f.state().rules.length, 0);
});
test('external probes reject edge challenges and accept only API validation and live RSA rejection', async () => {
  const calls = [];
  const proof = await verifyBotonlyEdge({ attempts: 1, send: async (url, init) => {
    calls.push({ url, init }); assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'manual');
    return url.endsWith('/v1/events') ? Response.json({}, { status: 400 }) : Response.json({}, { status: 401, headers: { 'x-nexa-webhook': 'waffo-live' } });
  } });
  assert.equal(proof.transactionExecuted, false); assert.equal(calls[0].init.body, '[]'); assert.equal(calls[1].init.body, '{}');
  await assert.rejects(verifyBotonlyEdge({ attempts: 1, send: async () => new Response('', { status: 403, headers: { 'cf-mitigated': 'challenge' } }) }), { message: 'botonly_edge_unverified_telemetry_403_webhook_403' });
  await assert.rejects(verifyBotonlyEdge({ attempts: 1, send: async url => new Response('{}', { status: url.endsWith('/v1/events') ? 400 : 401 }) }), /botonly_edge_unverified/);
});
