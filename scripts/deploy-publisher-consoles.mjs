// Refresh already-provisioned publisher Workers; never create domains or bindings.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, RUNNER_TEMP: temp } = process.env;
if (process.env.GITHUB_ACTIONS !== 'true' || !token || !/^[a-f0-9]{32}$/.test(account || '') || !temp) throw new Error('deployment_context_missing');
async function api(path) {
 const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
 if (!r.ok) throw new Error(`publisher_read_failed_${r.status}`);
 const d=await r.json(); if (!d.success) throw new Error('publisher_read_failed'); return d.result;
}
const domains = await api('workers/domains');
for (const [name,host] of [['nexa-developer-console','dev.consol.pcln.top'],['nexa-creator-console','creator.consol.pcln.top']]) {
 if (!domains.some(d=>d.hostname===host && d.service===name)) throw new Error('publisher_domain_binding_mismatch');
 const settings=await api(`workers/scripts/${name}/settings`);
 const config={name,main:resolve('worker/index.mjs'),compatibility_date:'2026-09-26',compatibility_flags:['nodejs_compat'],workers_dev:false,keep_vars:true,
 routes:[{pattern:host,custom_domain:true}],assets:{directory:resolve('dist'),binding:'ASSETS',not_found_handling:'single-page-application',run_worker_first:true},vars:{},services:[]};
 for(const b of settings.bindings){
  if(b.type==='service')config.services.push({binding:b.name,service:b.service,...(b.environment?{environment:b.environment}:{})});
  else if(b.type==='plain_text')config.vars[b.name]=b.text;
  else if(b.type==='json')config.vars[b.name]=typeof b.json==='string'?JSON.parse(b.json):b.json;
  else if(!['secret_text','assets'].includes(b.type))throw new Error('publisher_binding_type_unexpected');
 }
 for(const [binding,service]of [['API','nexa-api'],['AUTH','nexa-auth']])if(!config.services.some(b=>b.binding===binding&&b.service===service))throw new Error('publisher_service_binding_missing');
 const schedules=await api(`workers/scripts/${name}/schedules`);config.triggers={crons:(Array.isArray(schedules)?schedules:schedules.schedules).map(s=>s.cron)};
 const file=resolve(temp,name+'.json');await writeFile(file,JSON.stringify(config));
 if(JSON.stringify((await api(`workers/scripts/${name}/settings`)).bindings)!==JSON.stringify(settings.bindings))throw new Error('publisher_bindings_changed');
 const output=execFileSync('pnpm',['exec','wrangler','deploy','--config',file],{encoding:'utf8',maxBuffer:8*1024*1024});
 console.log(JSON.stringify({worker:name,version:output.match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1],commit:process.env.GITHUB_SHA}));
}
