// Web has no business tables or authentication implementation. Bindings target separately deployed projects.
const GITHUB_RELEASES_UPSTREAM = 'https://api.github.com/repos/PCL-N-Edition/PCL-N/releases?per_page=100';

// 只信任 Cloudflare TLS 握手结果，客户端提供的证书请求头没有认证效力。
export function verifiedLauncherCertificate(request, env) {
  const tls = request.cf?.tlsClientAuth;
  const fingerprint = String(tls?.certFingerprintSHA256 ?? '').replaceAll(':', '').toLowerCase();
  if (tls?.certPresented !== '1' || tls.certVerified !== 'SUCCESS' || tls.certRevoked === '1' || !/^[a-f0-9]{64}$/.test(fingerprint)) return null;
  return fingerprint;
}

// 同源 GitHub Releases 代理：浏览器端直连 api.github.com 在部分网络环境会被
// DNS 污染（解析到 loopback 触发 Chrome 私有网络访问拦截）或撞未认证限流。
// 由边缘代为请求并缓存 5 分钟；上游失败时返回 502，前端自动回退直连与本地快照。
async function githubReleases() {
  const cache = caches.default;
  const cacheKey = new Request('https://pcln.top/api/v1/github/releases', { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  let upstream;
  try {
    upstream = await fetch(GITHUB_RELEASES_UPSTREAM, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nexa-web-worker', 'X-GitHub-Api-Version': '2022-11-28' }
    });
  } catch {
    upstream = null;
  }
  if (!upstream || !upstream.ok) {
    return Response.json({ type: 'about:blank', title: 'Bad Gateway', status: 502, detail: 'GitHub 目录暂不可用' }, { status: 502, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
  }
  const body = await upstream.text();
  const response = new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, s-maxage=300, max-age=0' } });
  try { await cache.put(cacheKey, response.clone()); } catch { /* 缓存写入失败不影响本次响应 */ }
  return response;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path === '/api/v1/github/releases') return await githubReleases();
      if (path.startsWith('/api/')) {
        const headers = new Headers(request.headers);
        headers.delete('x-nexa-gateway-token'); headers.delete('x-nexa-client-certificate');
        if (path.startsWith('/api/v1/launcher/')) {
          const certificate = verifiedLauncherCertificate(request, env);
          if (!certificate) return Response.json({ type: 'about:blank', status: 403, title: 'Forbidden', detail: '该接口需要受信任的mTLS客户端证书' }, { status: 403, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
          if (!env.LAUNCHER_GATEWAY_TOKEN) return Response.json({ type: 'about:blank', status: 503, title: 'Service Unavailable', detail: '启动器接口尚未启用' }, { status: 503, headers: { 'cache-control': 'no-store' } });
          headers.set('x-nexa-gateway-token', env.LAUNCHER_GATEWAY_TOKEN);
          headers.set('x-nexa-client-certificate', certificate);
          headers.delete('cookie');
        }
        return await env.API.fetch(new Request(request, { headers }));
      }
      if (path.startsWith('/auth/')) return await env.AUTH.fetch(request);
      // Cloudflare 边缘国家码：供定价页本地化价格预览；缺失时返回 null，
      // 前端不传国家码，由 Paddle 按访客 IP 自动定位。
      if (path === '/geo.json') return Response.json({ country: request.cf?.country ?? null }, { headers: { 'cache-control': 'no-store' } });
      return await env.ASSETS.fetch(request);
    } catch {
      return Response.json({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: '服务暂时不可用' }, { status: 503, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
    }
  }
};
