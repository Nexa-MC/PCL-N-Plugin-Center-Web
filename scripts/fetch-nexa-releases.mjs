import { writeFileSync, readFileSync } from "node:fs";
const target = new URL("../public/nexa-releases.json", import.meta.url);
try {
  const response = await fetch("https://api.github.com/repos/Nexa-MC/PCL-N/releases?per_page=100", {
    headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  const releases = (await response.json()).filter(r => !r.draft && /^v?2\.\d+\.\d+(?:\.(?:alpha|beta)\.[1-9]\d*|\.ci\.[a-f0-9]{6})?$/.test(r.tag_name))
    .map(({ tag_name, name, body, published_at, html_url, assets }) => ({ tag_name, name, body: body || "", published_at, html_url,
      assets: assets.map(({ name, browser_download_url, size }) => ({ name, browser_download_url, size })) }));
  if (!releases.length) throw new Error("No published Nexa releases");
  writeFileSync(target, JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2) + "\n");
  console.log(`Nexa: ${releases.length} published releases synchronized.`);
} catch (error) {
  const saved = JSON.parse(readFileSync(target, "utf8"));
  if (!saved.releases?.length) throw error;
  console.warn(`Nexa: keeping the last verified release snapshot (${error.message}).`);
}
