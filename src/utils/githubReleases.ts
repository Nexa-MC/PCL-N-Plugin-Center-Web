import { fetchReleaseCatalogs, normalizeReleaseCatalog, type GithubRelease } from './releaseCatalog.ts';
export type { GithubRelease } from './releaseCatalog.ts';
// 同源 Worker 代理优先：规避本地 DNS 污染（api.github.com 被解析到 loopback 时，
// 浏览器会以私有网络访问为由直接拦截）与未认证限流；代理不可用再直连 GitHub。
const proxyApi = "/api/v1/github/releases";
let cached: GithubRelease[] | undefined;
let checkedAt = 0;
let pending: Promise<GithubRelease[]> | undefined;
async function fetchCatalog(): Promise<unknown> {
  try {
    const proxied = await fetch(proxyApi, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (proxied.ok) return await proxied.json();
  } catch { /* 代理未部署或暂不可用，回退直连 */ }
  return await fetchReleaseCatalogs();
}
export async function loadGithubReleases(signal?: AbortSignal): Promise<GithubRelease[]> {
  signal?.throwIfAborted();
  if (cached && Date.now() - checkedAt < 60000) return cached;
  pending ??= (async () => {
    const payload = await fetchCatalog();
    cached = normalizeReleaseCatalog(payload);
    checkedAt = Date.now(); return cached;
  })().finally(() => { pending = undefined; });
  const result = await pending;
  signal?.throwIfAborted();
  return result;
}
/** A visible page revalidates every minute and immediately after returning online/in focus. */
export function watchReleaseUpdates(refresh: () => void): () => void {
  const update = () => { if (document.visibilityState === "visible") refresh(); };
  const timer = window.setInterval(update, 60000);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("online", update);
  window.addEventListener("focus", update);
  return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); window.removeEventListener("online", update); window.removeEventListener("focus", update); };
}
