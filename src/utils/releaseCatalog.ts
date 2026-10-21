import { RELEASE_APIS, isReleasePage, isReleaseAsset } from './releaseRepository.ts';

export interface GithubRelease {
  tag_name: string; name: string; body: string; published_at: string; html_url: string;
  draft?: boolean; prerelease?: boolean;
  assets: { name: string; browser_download_url: string; size: number }[];
}

/** Shared by the browser, Worker and snapshot generator. */
export function normalizeReleaseCatalog(payload: unknown): GithubRelease[] {
  if (!Array.isArray(payload)) throw new Error('Invalid GitHub release catalog');
  return payload.filter((r): r is GithubRelease => r && typeof r.tag_name === 'string'
    && r.draft !== true && typeof r.published_at === 'string' && Array.isArray(r.assets)
    && typeof r.html_url === 'string' && isReleasePage(r.html_url, r.tag_name))
    .map(r => ({ tag_name: r.tag_name, name: typeof r.name === 'string' ? r.name : r.tag_name,
      body: typeof r.body === 'string' ? r.body : '', published_at: r.published_at, html_url: r.html_url,
      assets: r.assets.filter(a => a && typeof a.name === 'string'
        && typeof a.browser_download_url === 'string' && Number.isSafeInteger(a.size) && a.size > 0
        && isReleaseAsset(a.browser_download_url, r.tag_name, a.name))
        .map(a => ({ name: a.name, browser_download_url: a.browser_download_url, size: a.size })) }));
}

/** Catalog order is priority order: distribution, source, then historical releases. */
export function mergeReleaseCatalogs(catalogs: unknown[]): GithubRelease[] {
  const releases = new Map<string, GithubRelease>();
  for (const catalog of catalogs) for (const release of normalizeReleaseCatalog(catalog)) {
    const identity = release.tag_name.replace(/^v/, '');
    if (!releases.has(identity)) releases.set(identity, release);
  }
  return [...releases.values()];
}

export async function fetchReleaseCatalogs(fetcher: typeof fetch = fetch, userAgent?: string): Promise<GithubRelease[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (userAgent) headers['User-Agent'] = userAgent;
  const results = await Promise.allSettled(RELEASE_APIS.map(async url => {
    const response = await fetcher(url, { headers,
      cache: 'no-cache', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    return normalizeReleaseCatalog(await response.json());
  }));
  const catalogs = results.filter((r): r is PromiseFulfilledResult<GithubRelease[]> => r.status === 'fulfilled');
  if (!catalogs.length) throw new Error('All GitHub release sources are unavailable');
  return mergeReleaseCatalogs(catalogs.map(r => r.value));
}
