import { loadGithubReleases } from "./githubReleases.ts";
import { RELEASE_GITHUB, isReleasePage, isReleaseAsset } from './releaseRepository.ts';
export const NEXA_GITHUB = RELEASE_GITHUB;
export interface NexaAsset { name: string; browser_download_url: string; size: number }
export interface NexaRelease { tag_name: string; name: string; body: string; published_at: string; html_url: string; assets: NexaAsset[] }
export function nexaChannel(tag: string): "alpha" | "beta" | "ci" | "release" | null {
  const match = /^v?(2\.\d+\.\d+)(?:\.(alpha|beta)\.([1-9]\d*)|\.ci\.([a-f0-9]{6}))?$/.exec(tag);
  return match ? (match[2] as "alpha" | "beta") || (match[4] ? "ci" : "release") : null;
}
export function releaseAssets(release: NexaRelease, platform: string, architecture: string): NexaAsset[] {
  const version = release.tag_name.replace(/^v/, "");
  // Alpha 4 renamed the artifacts. Keep earlier releases downloadable as published.
  const prefixes = [`Nexa-${version}-${platform}-${architecture}.`, `PCL-Nexa-${version}-${platform}-${architecture}.`];
  const formats: Record<string, string[]> = { win: ["setup.exe", "msi", "portable.zip"], osx: ["dmg", "portable.tar.gz"], linux: ["deb", "rpm", "AppImage", "portable.tar.gz"] };
  return (formats[platform] || []).flatMap(format => {
    for (const prefix of prefixes) {
      const asset = release.assets.find(a => a.name === prefix + format
        && isReleaseAsset(a.browser_download_url, release.tag_name, a.name));
      if (asset) return [asset];
    }
    return [];
  });
}
export async function loadNexaCatalog(signal?: AbortSignal): Promise<{ releases: NexaRelease[]; source: "github" | "snapshot" }> {
  try {
    const releases = (await loadGithubReleases(signal)).filter(r => nexaChannel(r.tag_name) !== null);
    return { releases, source: "github" };
  } catch (error) {
    signal?.throwIfAborted();
    const response = await fetch(`${import.meta.env?.BASE_URL || "/"}nexa-releases.json`, { signal, cache: "no-store" });
    if (!response.ok) throw error;
    const data = await response.json();
    if (!Array.isArray(data.releases)) throw new Error("Invalid release catalog");
    return { source: "snapshot", releases: data.releases.filter((r: NexaRelease) => nexaChannel(r.tag_name) !== null && Array.isArray(r.assets)
      && isReleasePage(r.html_url, r.tag_name)) };
  }
}
export async function loadNexaReleases(signal?: AbortSignal): Promise<NexaRelease[]> { return (await loadNexaCatalog(signal)).releases; }
