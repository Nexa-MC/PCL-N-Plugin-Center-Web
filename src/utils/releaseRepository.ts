/** Source, distribution and historical repositories have distinct roles. */
export const SOURCE_REPOSITORY = 'Nexa-MC/NexaCL';
export const SOURCE_GITHUB = `https://github.com/${SOURCE_REPOSITORY}`;
export const RELEASE_REPOSITORY = 'Nexa-MC/NexaCL-Update';
export const RELEASE_GITHUB = `https://github.com/${RELEASE_REPOSITORY}`;
export const LEGACY_REPOSITORY = 'Nexa-MC/PCL-N';
export const LEGACY_GITHUB = `https://github.com/${LEGACY_REPOSITORY}`;
export const RELEASE_REPOSITORIES = [RELEASE_REPOSITORY, SOURCE_REPOSITORY, LEGACY_REPOSITORY] as const;
export const RELEASE_APIS = RELEASE_REPOSITORIES.map(repository => `https://api.github.com/repos/${repository}/releases?per_page=100`);
export const RELEASE_API = RELEASE_APIS[0];
const roots = [RELEASE_GITHUB, SOURCE_GITHUB, LEGACY_GITHUB, 'https://github.com/PCL-N-Edition/PCL-N'];
const safeTag = (tag: string) => /^[A-Za-z0-9._-]+$/.test(tag);
const safeName = (name: string) => !!name && !/[/?#\\\u0000-\u001f]/.test(name) && name !== '.' && name !== '..';

export function isReleasePage(url: string, tag: string): boolean {
  return safeTag(tag) && roots.some(root => url === `${root}/releases/tag/${tag}`);
}

export function isReleaseAsset(url: string, tag: string, name: string): boolean {
  return safeTag(tag) && safeName(name)
    && roots.some(root => url === `${root}/releases/download/${tag}/${encodeURIComponent(name)}`);
}

/** Derive the identity from the pinned URL instead of trusting query-string names. */
export function releaseAssetIdentity(raw: string): { url: string; tag: string; name: string } | null {
  try {
    const url = new URL(raw);
    if (url.search || url.hash || url.username || url.password) return null;
    for (const root of roots) {
      const prefix = `${root}/releases/download/`;
      if (!url.href.startsWith(prefix)) continue;
      const parts = url.href.slice(prefix.length).split('/');
      if (parts.length !== 2) return null;
      const tag = decodeURIComponent(parts[0]); const name = decodeURIComponent(parts[1]);
      if (isReleaseAsset(url.href, tag, name)) return { url: url.href, tag, name };
    }
  } catch { /* Invalid or untrusted link. */ }
  return null;
}

/** A signature must belong to this exact artifact, repository and tag. */
export function releaseSignatureUrl(assetUrl: string, supplied = ''): string {
  const asset = releaseAssetIdentity(assetUrl);
  if (!asset) return '';
  const expected = `${asset.url}.asc`;
  return !supplied || supplied === expected ? expected : '';
}
