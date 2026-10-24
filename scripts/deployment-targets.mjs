import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Public and management Workers share a bundle, but have separate domains.
// Shared-only pushes retain the previous management deployment behavior.
export function deploymentTargets(paths) {
  const web = paths.some(path => /^(public\/|src\/views\/(cloud|site)\/|src\/config\/(publicPricing|pricing)\.ts$|wrangler\.jsonc$)/.test(path));
  const manage = paths.some(path => /^(src\/views\/manage\/|src\/styles\/management\.css$|src\/api\/management\.ts$|wrangler\.manage\.jsonc$)/.test(path));
  return [...(web ? ['web'] : []), ...(manage || !web ? ['manage'] : [])];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let targets;
  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    if (!['web', 'manage'].includes(process.env.MANUAL_TARGET)) throw new Error('Unknown manual deployment target');
    targets = [process.env.MANUAL_TARGET];
  } else {
    const before = process.env.BEFORE_SHA;
    if (!/^[a-f0-9]{40}$/.test(before ?? '') || /^0+$/.test(before)) throw new Error('Missing push base commit; use reviewed manual deployment');
    const paths = execFileSync('git', ['diff', '--name-only', before, 'HEAD'], { encoding: 'utf8' }).trim().split('\n');
    targets = deploymentTargets(paths);
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `targets=${targets.join(',')}\nweb=${targets.includes('web')}\n`);
  console.log(`Deploying: ${targets.join(', ')}`);
}
