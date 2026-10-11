import { loadGithubReleases } from './githubReleases.ts';
import { isReleaseAsset } from './releaseRepository.ts';
/** Launcher downloads use GitHub with a same-origin saved catalog fallback. */

export type ReleaseChannel = "release" | "beta" | "ci";
export type Packaging = "legacy" | "v2";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface ReleaseVersion {
  id: string;
  label: string;
  tag: string;
  channel: ReleaseChannel;
  packaging: Packaging;
  supportsPluginChoice: boolean;
  publishedAt?: string;
  packageAssets: ReleaseAsset[];
}

export interface AtomReleaseEntry {
  tag: string;
  title: string | null;
  htmlUrl: string | null;
  notes: string | null;
  updated: string | null;
}

/** Align with production release host (updater defaults may redirect here). */
export const DEFAULT_OWNER = "Nexa-MC";
export const DEFAULT_REPO = "PCL-N";
export const CI_ROLLING_TAG = "ci-latest";

const GH = "https://github.com";
const TAG_FROM_URL = /\/releases\/tag\/(?<tag>[^/?#\s"']+)/i; // no /g — single-shot match

/** Offline fallback when GitHub is unreachable (same channels as updater). */
export const FALLBACK_VERSIONS: ReleaseVersion[] = [
  {
    id: "v1.3.20-beta",
    label: "1.3.20 Beta",
    tag: "v1.3.20-beta",
    channel: "beta",
    packaging: "v2",
    supportsPluginChoice: false,
    packageAssets: []
  },
  {
    id: "v1.3.19-beta",
    label: "1.3.19 Beta",
    tag: "v1.3.19-beta",
    channel: "beta",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  },
  {
    id: "v1.2.7-release",
    label: "1.2.7",
    tag: "v1.2.7-release",
    channel: "release",
    packaging: "legacy",
    supportsPluginChoice: true,
    packageAssets: []
  },
  {
    id: CI_ROLLING_TAG,
    label: "CI latest",
    tag: CI_ROLLING_TAG,
    channel: "ci",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  }
];

// ─── Version helpers (LauncherUpdateService) ─────────────────────────────────

export function normalizeVersion(value: string): string {
  let trimmed = value.trim();
  if (trimmed.startsWith("v") || trimmed.startsWith("V")) trimmed = trimmed.slice(1);
  const plus = trimmed.indexOf("+");
  if (plus >= 0) trimmed = trimmed.slice(0, plus);
  trimmed = trimmed.replace(/_/g, "-");
  const space = trimmed.indexOf(" ");
  if (space > 0) trimmed = `${trimmed.slice(0, space)}-${trimmed.slice(space + 1).replace(/ /g, "-")}`;
  return trimmed;
}

export function isCiTag(tag: string): boolean {
  return tag.toLowerCase() === CI_ROLLING_TAG;
}

export function isBetaTag(tag: string): boolean {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag).toLowerCase();
  return (
    n.includes("beta") ||
    n.includes("-rc") ||
    n.includes("preview") ||
    (/\bpre\b/.test(n) && !n.includes("release"))
  );
}

export function isStableTag(tag: string): boolean {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag);
  return !isBetaTag(tag) && !n.toLowerCase().includes("alpha");
}

export function detectChannel(tag: string): ReleaseChannel {
  if (isCiTag(tag)) return "ci";
  if (isBetaTag(tag)) return "beta";
  return "release";
}

export function compareVersionsDesc(left: string, right: string): number {
  const ln = normalizeVersion(left);
  const rn = normalizeVersion(right);
  const core = (v: string) => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(0, i) : v;
  };
  const pre = (v: string) => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(i + 1).toLowerCase() : "";
  };
  const parse = (s: string) => {
    const p = s.split(".").map(x => parseInt(x, 10) || 0);
    while (p.length < 3) p.push(0);
    return p;
  };
  const a = parse(core(ln));
  const b = parse(core(rn));
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] - a[i];
  }
  const rank = (p: string) => {
    if (!p || p === "release") return 3;
    if (p.startsWith("rc")) return 2;
    if (p.includes("beta")) return 1;
    if (p.includes("ci")) return 0;
    return 1;
  };
  const lr = rank(pre(ln));
  const rr = rank(pre(rn));
  if (lr !== rr) return rr - lr;
  return pre(rn).localeCompare(pre(ln), undefined, { numeric: true });
}

export function compareTagsDesc(a: string, b: string): number {
  return compareVersionsDesc(a, b);
}

/** Host-only package names since ~1.3.6; older used WithPlugin/NoPlugin. */
export function supportsPluginChoice(tag: string): boolean {
  if (isCiTag(tag)) return false;
  const core = normalizeVersion(tag).split("-")[0];
  const m = core.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return true;
  const major = +m[1];
  const minor = +m[2];
  const patch = +m[3];
  if (major > 1) return false;
  if (major === 1 && minor > 3) return false;
  if (major === 1 && minor === 3 && patch >= 6) return false;
  return true;
}

/**
 * Native installers (_Installer.msi/exe/dmg/deb/rpm/AppImage + _Portable.*)
 * ship from v1.3.20-beta onward. Older tags keep legacy zip/tar.gz only.
 */
export function detectPackaging(tag: string): Packaging {
  if (isCiTag(tag)) return "legacy";
  const core = normalizeVersion(tag).split("-")[0];
  const m = core.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return "legacy";
  const major = +m[1];
  const minor = +m[2];
  const patch = +m[3];
  if (major > 1) return "v2";
  if (major === 1 && minor > 3) return "v2";
  if (major === 1 && minor === 3 && patch >= 20) return "v2";
  return "legacy";
}

function labelFor(tag: string, channel: ReleaseChannel, title: string | null): string {
  if (channel === "ci") {
    const sha = title?.match(/[0-9a-f]{7,40}/i)?.[0];
    return sha ? `CI ${sha.slice(0, 7)}` : "CI latest";
  }
  const core = normalizeVersion(tag).replace(/-(release|beta|rc\d*)$/i, "");
  return channel === "beta" ? `${core} Beta` : core;
}

// ─── Atom (FetchReleaseFeedAsync + ParseAtomFeed) ────────────────────────────

export function parseAtomFeed(xml: string): AtomReleaseEntry[] {
  if (!xml?.trim()) return [];

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    // Fallback: regex parse (some environments return text/plain)
    return parseAtomFeedRegex(xml);
  }

  const entries: AtomReleaseEntry[] = [];
  const entryNodes = doc.getElementsByTagNameNS("*", "entry");
  for (let i = 0; i < entryNodes.length; i++) {
    const entry = entryNodes[i];
    const links = entry.getElementsByTagNameNS("*", "link");
    let href: string | null = null;
    for (let j = 0; j < links.length; j++) {
      const h = links[j].getAttribute("href");
      if (h) {
        href = h;
        break;
      }
    }

    let tag: string | null = null;
    if (href) {
      const m = TAG_FROM_URL.exec(href);
      if (m?.groups?.tag) tag = decodeURIComponent(m.groups.tag);
      else {
        const m2 = href.match(TAG_FROM_URL);
        if (m2) tag = decodeURIComponent(m2[1] ?? m2[0].split("/").pop()!);
      }
    }

    if (!tag) {
      const id = entry.getElementsByTagNameNS("*", "id")[0]?.textContent;
      if (id) {
        const slash = id.lastIndexOf("/");
        if (slash >= 0 && slash < id.length - 1) tag = id.slice(slash + 1);
      }
    }
    if (!tag) continue;

    const title = entry.getElementsByTagNameNS("*", "title")[0]?.textContent ?? null;
    const content =
      entry.getElementsByTagNameNS("*", "content")[0]?.textContent ??
      entry.getElementsByTagNameNS("*", "summary")[0]?.textContent ??
      null;
    const updated = entry.getElementsByTagNameNS("*", "updated")[0]?.textContent ?? null;

    entries.push({
      tag,
      title,
      htmlUrl: href,
      notes: content,
      updated
    });
  }

  return entries.length ? entries : parseAtomFeedRegex(xml);
}

function parseAtomFeedRegex(xml: string): AtomReleaseEntry[] {
  const entries: AtomReleaseEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let em: RegExpExecArray | null;
  while ((em = entryRe.exec(xml)) !== null) {
    const block = em[1];
    const href =
      block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ||
      [...block.matchAll(/<link[^>]+href="([^"]+)"/gi)].map(x => x[1]).find(Boolean) ||
      null;
    let tag: string | null = null;
    if (href) {
      const tm = href.match(/\/releases\/tag\/([^/?#\s"]+)/i);
      if (tm) tag = decodeURIComponent(tm[1]);
    }
    if (!tag) {
      const id = block.match(/<id>([^<]+)<\/id>/i)?.[1];
      if (id) {
        const slash = id.lastIndexOf("/");
        if (slash >= 0) tag = id.slice(slash + 1);
      }
    }
    if (!tag) continue;
    const title = block.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || null;
    const updated = block.match(/<updated>([^<]*)<\/updated>/i)?.[1] || null;
    entries.push({
      tag,
      title: title
        ? title
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
        : null,
      htmlUrl: href,
      notes: null,
      updated
    });
  }
  return entries;
}

async function fetchReleaseFeed(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<AtomReleaseEntry[]> {
  const url = `${GH}/${owner}/${repo}/releases.atom`;
  const response = await fetch(url, {
    cache: "no-cache",
    signal,
    redirect: "follow",
    headers: {
      Accept: "application/atom+xml,application/xml,text/xml,*/*",
      // Same product UA family as the desktop updater.
    }
  });
  if (!response.ok) {
    throw new Error(`无法读取发布订阅 (${response.status})`);
  }
  const xml = await response.text();
  return parseAtomFeed(xml);
}

/**
 * ResolveLatestStableTagAsync: read tag from /releases/latest redirect.
 * Browser may not expose Location cross-origin; then fall back to feed (same as updater).
 */
async function resolveLatestStableTag(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<string | null> {
  const url = `${GH}/${owner}/${repo}/releases/latest`;
  try {
    // Prefer manual so we can inspect Location when the runtime exposes it.
    const manual = await fetch(url, {
      cache: "no-cache",
      signal,
      redirect: "manual",
      headers: { Accept: "text/html,*/*" }
    });
    const loc = manual.headers.get("Location") || manual.headers.get("location");
    if (loc) {
      const m = TAG_FROM_URL.exec(loc) || loc.match(TAG_FROM_URL);
      if (m) return decodeURIComponent((m.groups?.tag ?? m[1]) as string);
    }
  } catch {
    // continue
  }

  try {
    const followed = await fetch(url, {
      cache: "no-cache",
      signal,
      redirect: "follow",
      headers: { Accept: "text/html,*/*" }
    });
    // Some environments expose final URL after follow.
    if (followed.url) {
      const m = TAG_FROM_URL.exec(followed.url) || followed.url.match(TAG_FROM_URL);
      if (m) return decodeURIComponent((m.groups?.tag ?? m[1]) as string);
    }
    // Or parse HTML of the landing tag page.
    if (followed.ok) {
      const html = await followed.text();
      const m = html.match(/\/releases\/tag\/([^"'?\s#]+)/i);
      if (m) return decodeURIComponent(m[1]);
    }
  } catch {
    // fall through
  }

  return null;
}

// ─── Channel resolution (ResolveStableRelease / ResolveBetaRelease / CI) ─────

function resolveStableFromFeed(
  feed: AtomReleaseEntry[],
  latestTag: string | null
): AtomReleaseEntry | null {
  if (latestTag) {
    const fromFeed = feed.find(e => e.tag.toLowerCase() === latestTag.toLowerCase());
    if (fromFeed) return fromFeed;
    return {
      tag: latestTag,
      title: latestTag,
      htmlUrl: `${GH}/${DEFAULT_OWNER}/${DEFAULT_REPO}/releases/tag/${encodeURIComponent(latestTag)}`,
      notes: null,
      updated: null
    };
  }
  return feed.find(e => isStableTag(e.tag)) ?? null;
}

function entryToVersion(entry: AtomReleaseEntry): ReleaseVersion {
  const channel = detectChannel(entry.tag);
  return {
    id: entry.tag,
    label: labelFor(entry.tag, channel, entry.title),
    tag: entry.tag,
    channel,
    packaging: detectPackaging(entry.tag),
    supportsPluginChoice: supportsPluginChoice(entry.tag),
    publishedAt: entry.updated ?? undefined,
    packageAssets: []
  };
}

function sortVersions(versions: ReleaseVersion[]): ReleaseVersion[] {
  const order: Record<ReleaseChannel, number> = { release: 0, beta: 1, ci: 2 };
  return [...versions].sort((a, b) => {
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    if (a.channel === "ci") return 0;
    return compareVersionsDesc(a.tag, b.tag);
  });
}

/**
 * Build the full list from Atom (history) + latest redirect (stable pin) + ci-latest.
 * Same inputs the desktop updater uses.
 */
export async function fetchLauncherVersionsFromGitHub(
  signal?: AbortSignal,
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO
): Promise<ReleaseVersion[]> {
  const feed = await fetchReleaseFeed(owner, repo, signal);
  const latestStable = await resolveLatestStableTag(owner, repo, signal);

  const byTag = new Map<string, ReleaseVersion>();

  for (const entry of feed) {
    const v = entryToVersion(entry);
    if (!byTag.has(v.tag)) byTag.set(v.tag, v);
  }

  // Pin / ensure stable from /releases/latest
  const stableEntry = resolveStableFromFeed(feed, latestStable);
  if (stableEntry) {
    const v = entryToVersion(stableEntry);
    byTag.set(v.tag, v);
  }

  // CI rolling tag (CheckCiAsync)
  if (!byTag.has(CI_ROLLING_TAG)) {
    byTag.set(CI_ROLLING_TAG, {
      id: CI_ROLLING_TAG,
      label: "CI latest",
      tag: CI_ROLLING_TAG,
      channel: "ci",
      packaging: "legacy",
      supportsPluginChoice: false,
      packageAssets: []
    });
  }

  const versions = sortVersions([...byTag.values()]);

  // Put /releases/latest stable first among release channel (display order).
  if (latestStable) {
    const idx = versions.findIndex(v => v.tag === latestStable);
    if (idx > 0 && versions[idx].channel === "release") {
      const [item] = versions.splice(idx, 1);
      const insertAt = versions.findIndex(v => v.channel === "release");
      versions.splice(insertAt < 0 ? 0 : insertAt, 0, item);
    }
  }

  if (!versions.length) throw new Error("未找到可用的发布版本。");
  return versions;
}

/**
 * Primary: Cloudflare R2/D1 catalog exposed by the Worker.
 * Secondary: same-origin catalog generated from that endpoint at build time.
 * Last: baked-in FALLBACK_VERSIONS.
 */
/** Normalize packaging flags so build-time catalogs cannot leave installers disabled. */
export function normalizeReleaseVersion(v: ReleaseVersion): ReleaseVersion {
  return {
    ...v,
    packageAssets: v.packageAssets ?? [],
    channel: v.channel || detectChannel(v.tag),
    packaging: detectPackaging(v.tag),
    supportsPluginChoice: supportsPluginChoice(v.tag)
  };
}

export type LauncherVersionsSource = "github" | "static" | "fallback";

export interface LauncherVersionsResult {
  versions: ReleaseVersion[];
  source: LauncherVersionsSource;
  generatedAt?: string;
}

export type FetchLauncherVersionsOptions = {
  signal?: AbortSignal;
};

export async function fetchLauncherVersions(
  signal?: AbortSignal,
  options?: Omit<FetchLauncherVersionsOptions, "signal">
): Promise<ReleaseVersion[]> {
  const result = await fetchLauncherVersionsWithSource({ signal, ...options });
  return result.versions;
}

/**
 * Sync pull from Plugin Center API only (forceRefresh by default).
 * Fallback chain is used only when the API is unreachable.
 */
export async function fetchLauncherVersionsWithSource(
  options: FetchLauncherVersionsOptions = {}
): Promise<LauncherVersionsResult> {
  const { signal } = options;

  // GitHub is the live source; both product families share one bounded request cache.
  try {
    const releases = await loadGithubReleases(signal);
    const versions = releases.filter(r => /^v?1\./i.test(r.tag_name) || r.tag_name === CI_ROLLING_TAG)
      .map(r => normalizeReleaseVersion({ id: r.tag_name, tag: r.tag_name, label: r.tag_name,
        channel: detectChannel(r.tag_name), packaging: detectPackaging(r.tag_name), supportsPluginChoice: supportsPluginChoice(r.tag_name),
        publishedAt: r.published_at, packageAssets: r.assets.filter(a => typeof a.name === "string"
          && isReleaseAsset(a.browser_download_url, r.tag_name, a.name)) }));
    if (versions.length) return { versions: sortVersions(versions), source: "github", generatedAt: new Date().toISOString() };
  } catch { signal?.throwIfAborted(); }

  // 2) Build-time snapshot / baked fallbacks.
  try {
    const catalogUrl = `${import.meta.env.BASE_URL || "/"}launcher-releases.json`.replace(
      /\/{2,}/g,
      "/"
    );
    const response = await fetch(catalogUrl, {
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" }
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        versions?: ReleaseVersion[];
        generatedAt?: string;
      };
      const list = (payload.versions ?? [])
        .map(v => normalizeReleaseVersion({ ...v, packageAssets: v.packageAssets ?? [] } as ReleaseVersion))
        .filter(v => v.tag);
      if (list.length) {
        return {
          versions: sortVersions(list),
          source: "static",
          generatedAt: payload.generatedAt
        };
      }
    }
  } catch (err) {
    signal?.throwIfAborted();
    console.warn("[download] Local launcher-releases.json unavailable:", err);
  }

  return {
    versions: sortVersions(FALLBACK_VERSIONS.map(normalizeReleaseVersion)),
    source: "fallback"
  };
}

export function versionsForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion[] {
  return all.filter(v => v.channel === channel).sort((a, b) => {
    if (channel === "ci") return 0;
    return compareVersionsDesc(a.tag, b.tag);
  });
}

export function latestForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion | undefined {
  // ResolveBetaRelease / ResolveStableRelease: first match in newest-first order.
  return versionsForChannel(all, channel)[0];
}

/**
 * Release asset naming (matches scripts/package-release-*.{ps1,sh}):
 *   PCL_N_{Release|Beta|CI}_{runtimeId}_{SelfContained|NoRuntime}[_{WithPlugin|NoPlugin}]
 *     .zip | .tar.gz                              — updater / full archive
 *     _Installer.{msi|exe|dmg|deb|rpm|AppImage} — system installers
 *     _Portable.{exe|tar.gz}                    — portable payloads
 */
export function buildAssetFileName(input: {
  channel: ReleaseChannel;
  runtimeId: string;
  includeRuntime: boolean;
  includePlugin: boolean;
  supportsPluginChoice: boolean;
  packaging: Packaging;
  platform: "windows" | "macos" | "linux";
  delivery: "installer" | "portable";
  packageFormat: string;
}): string {
  const configuration =
    input.channel === "release" ? "Release" : input.channel === "ci" ? "CI" : "Beta";
  const variant =
    input.channel === "ci" || input.includeRuntime ? "SelfContained" : "NoRuntime";
  const plugin = input.supportsPluginChoice
    ? `_${input.includePlugin ? "WithPlugin" : "NoPlugin"}`
    : "";
  const base = `PCL_N_${configuration}_${input.runtimeId}_${variant}${plugin}`;

  if (input.packaging === "v2") {
    if (input.delivery === "portable") {
      // macOS ships .app inside tar.gz (no separate Portable SKU).
      if (input.platform === "macos") return `${base}.tar.gz`;
      return `${base}_Portable.${input.platform === "windows" ? "exe" : "tar.gz"}`;
    }
    const suffix =
      input.packageFormat === "exe-installer"
        ? "exe"
        : input.packageFormat === "appimage"
          ? "AppImage"
          : input.packageFormat;
    return `${base}_Installer.${suffix}`;
  }

  const ext = input.runtimeId.startsWith("win-") ? "zip" : "tar.gz";
  return `${base}.${ext}`;
}

/** LauncherUpdateService.BuildReleaseAssetUrl */
export function buildReleaseAssetUrl(
  tag: string,
  assetName: string,
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO
): string {
  return `${GH}/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

export function resolveDownloadUrls(
  version: ReleaseVersion,
  assetFileName: string
): { downloadUrl: string; signatureUrl: string; assetName: string } {
  const downloadUrl = buildReleaseAssetUrl(version.tag, assetFileName);
  return {
    downloadUrl,
    signatureUrl: `${downloadUrl}.asc`,
    assetName: assetFileName
  };
}
