export interface GithubRelease {
  tag_name: string; name: string; body: string; published_at: string; html_url: string; draft?: boolean;
  assets: { name: string; browser_download_url: string; size: number }[];
}
const api = "https://api.github.com/repos/PCL-N-Edition/PCL-N/releases?per_page=100";
// 同源 Worker 代理优先：规避本地 DNS 污染（api.github.com 被解析到 loopback 时，
// 浏览器会以私有网络访问为由直接拦截）与未认证限流；代理不可用再直连 GitHub。
const proxyApi = "/api/v1/github/releases";
let cached: GithubRelease[] | undefined;
let checkedAt = 0;
let pending: Promise<GithubRelease[]> | undefined;
async function fetchCatalog(signal?: AbortSignal): Promise<unknown> {
  try {
    const proxied = await fetch(proxyApi, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (proxied.ok) return await proxied.json();
  } catch { /* 代理未部署或暂不可用，回退直连 */ }
  signal?.throwIfAborted();
  const response = await fetch(api, { headers: { Accept: "application/vnd.github+json" }, cache: "no-cache", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return await response.json();
}
export async function loadGithubReleases(signal?: AbortSignal): Promise<GithubRelease[]> {
  signal?.throwIfAborted();
  if (cached && Date.now() - checkedAt < 60000) return cached;
  pending ??= (async () => {
    const payload = await fetchCatalog(signal);
    if (!Array.isArray(payload)) throw new Error("Invalid GitHub release catalog");
    const releases = payload.filter((r): r is GithubRelease => r && typeof r.tag_name === "string"
      && !r.draft && typeof r.published_at === "string" && Array.isArray(r.assets)
      && r.html_url === `https://github.com/PCL-N-Edition/PCL-N/releases/tag/${r.tag_name}`);
    cached = releases.map(r => ({ ...r, name: r.name || r.tag_name, body: r.body || "", assets: r.assets.filter(a => a && typeof a.name === "string" && typeof a.browser_download_url === "string" && Number.isFinite(a.size)) }));
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
