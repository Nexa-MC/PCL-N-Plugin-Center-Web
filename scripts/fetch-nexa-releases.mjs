import { fetchReleaseCatalogs, normalizeReleaseCatalog } from '../src/utils/releaseCatalog.ts';
import { nexaChannel, compareNexaReleases } from '../src/utils/nexaReleases.ts';
import { writeFileSync, readFileSync } from "node:fs";
const target = new URL("../public/nexa-releases.json", import.meta.url);
try {
  const releases = (await fetchReleaseCatalogs(fetch, 'nexa-web-snapshot')).filter(r => nexaChannel(r.tag_name) !== null).sort(compareNexaReleases);
  if (!releases.length) throw new Error("No published Nexa releases");
  writeFileSync(target, JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2) + "\n");
  console.log(`Nexa: ${releases.length} published releases synchronized.`);
} catch (error) {
  const saved = JSON.parse(readFileSync(target, "utf8"));
  if (!normalizeReleaseCatalog(saved.releases).some(r => nexaChannel(r.tag_name) !== null)) throw error;
  console.warn(`Nexa: keeping the last verified release snapshot (${error.message}).`);
}
