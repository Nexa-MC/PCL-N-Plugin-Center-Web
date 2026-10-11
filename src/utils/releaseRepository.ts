/** The launcher repository moved in October 2026; retain verified historical links. */
export const RELEASE_REPOSITORY = 'Nexa-MC/PCL-N';
export const RELEASE_GITHUB = `https://github.com/${RELEASE_REPOSITORY}`;
export const RELEASE_API = `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases?per_page=100`;
const roots = [RELEASE_GITHUB, 'https://github.com/PCL-N-Edition/PCL-N'];

export function isReleasePage(url: string, tag: string): boolean {
  return roots.some(root => url === `${root}/releases/tag/${tag}`);
}

export function isReleaseAsset(url: string, tag: string, name: string): boolean {
  return roots.some(root => url === `${root}/releases/download/${tag}/${name}`);
}
