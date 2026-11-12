// Bind only the two public website names. Custom Domains provision DNS and TLS.
import { pathToFileURL } from 'node:url';

export const publicHosts = ['pcln.top', 'www.pcln.top'];
export function validatePublicDomains(domains, records, routes) {
  for (const hostname of publicHosts) {
    const domain = domains.find(item => item.hostname === hostname);
    if (domain && (domain.service !== 'nexa-web' || domain.environment !== 'production')) throw new Error(`domain_conflict:${hostname}`);
    if (records.some(item => item.name === hostname && ['A', 'AAAA', 'CNAME'].includes(item.type)) && !domain) throw new Error(`existing_dns_requires_review:${hostname}`);
  }
  for (const route of routes) {
    if (['pcln.top/*', 'www.pcln.top/*'].includes(route.pattern) && route.script !== 'nexa-web') throw new Error(`route_conflict:${route.pattern}`);
  }
}

async function main() {
  const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!token || !/^[a-f0-9]{32}$/.test(account ?? '')) throw new Error('cloudflare_credentials_missing');
  async function api(path, method = 'GET', body) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/${path}`, {
      method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(`cloudflare_${method}_${response.status}:${JSON.stringify(result.errors)}`);
    return result.result;
  }
  const zones = await api('zones?name=pcln.top&status=active');
  if (zones.length !== 1 || zones[0].account.id !== account) throw new Error('public_zone_identity_mismatch');
  const zone = zones[0].id;
  const domains = await api(`accounts/${account}/workers/domains`);
  const records = (await Promise.all(publicHosts.map(name => api(`zones/${zone}/dns_records?name=${name}&per_page=100`)))).flat();
  const routes = await api(`zones/${zone}/workers/routes`);
  await api(`accounts/${account}/workers/services/nexa-web`);
  validatePublicDomains(domains, records, routes);
  console.log(JSON.stringify({ hosts: publicHosts, domains: domains.filter(d => publicHosts.includes(d.hostname)), records, routes: routes.filter(r => ['pcln.top/*', 'www.pcln.top/*'].includes(r.pattern)) }, null, 2));
  if (process.env.APPLY !== 'true') return;
  for (const hostname of publicHosts) {
    await api(`accounts/${account}/workers/domains`, 'PUT', { hostname, service: 'nexa-web', environment: 'production', zone_id: zone });
    console.log(`Bound ${hostname} to nexa-web; Cloudflare manages DNS and TLS.`);
  }
  const updated = await api(`accounts/${account}/workers/domains`);
  for (const hostname of publicHosts) {
    if (!updated.some(d => d.hostname === hostname && d.service === 'nexa-web')) throw new Error(`binding_missing:${hostname}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
