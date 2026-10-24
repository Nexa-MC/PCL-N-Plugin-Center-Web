// Web has no business tables or authentication implementation. Bindings target separately deployed projects.
import { fetchReleaseCatalogs } from '../src/utils/releaseCatalog.ts';

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
  const cacheKey = new Request('https://pcln.top/api/v1/github/releases?catalog=nexacl-source-update-history-v1', { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  let releases;
  try { releases = await fetchReleaseCatalogs(fetch, 'nexa-web-worker'); }
  catch {
    return Response.json({ type: 'about:blank', title: 'Bad Gateway', status: 502, detail: 'GitHub 目录暂不可用' }, { status: 502, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
  }
  const response = Response.json(releases, { headers: { 'cache-control': 'public, s-maxage=300, max-age=0' } });
  try { await cache.put(cacheKey, response.clone()); } catch { /* 缓存写入失败不影响本次响应 */ }
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    try {
      const publisherLanding = { 'dev.consol.pcln.top': '/publisher/plugins', 'creator.consol.pcln.top': '/publisher/themes' }[url.hostname];
      if (publisherLanding && path === '/') return new Response(null, { status: 302, headers: { location: new URL(publisherLanding, url).href, 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
      if (path.startsWith('/webhooks/wp_wh/')) {
        const scope = path === '/webhooks/wp_wh/live' ? 'live' : 'test';
        const marker = 'waffo-' + scope;
        const unavailable = () => Response.json({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: 'waffo_test_handler_unavailable' },
          { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '30', 'x-nexa-webhook': marker } });
        const problem = (status, detail, extra = {}) => Response.json({ type: 'about:blank', status, detail },
          { status, headers: { 'cache-control': 'no-store', 'x-nexa-webhook': marker, ...extra } });
        if (url.hostname !== 'pcln.top' || !['/webhooks/wp_wh/test', '/webhooks/wp_wh/live'].includes(path)) return problem(404, 'webhook_not_found');
        if (request.method !== 'POST') return problem(405, 'webhook_post_required', { allow: 'POST' });
        if (!request.headers.get('content-type')?.startsWith('application/json')) return problem(415, 'waffo_raw_json_required');
        const signature = request.headers.get('x-waffo-signature');
        if (!signature) return problem(401, 'waffo_test_signature_required');
        if (Number(request.headers.get('content-length')) > 65536) return problem(413, 'webhook_body_too_large');
        if (!env.API) return unavailable();
        const target = new URL('/api/webhooks/waffo-' + scope, url);
        // Do not parse or reserialize the signed bytes, and do not forward
        // browser authority or internal launcher gateway headers.
        const headers = new Headers({ 'content-type': request.headers.get('content-type'), 'x-waffo-signature': signature });
        const upstream = await env.API.fetch(new Request(target, new Request(request, { headers, redirect: 'manual' })));
        if (upstream.status === 404 || upstream.status >= 300 && upstream.status < 400 || upstream.headers.get('content-type')?.includes('text/html')) return unavailable();
        const reply = new Headers(upstream.headers);
        reply.delete('set-cookie'); reply.delete('location'); reply.set('cache-control', 'no-store'); reply.set('x-nexa-webhook', marker);
        return new Response(upstream.body, { status: upstream.status, headers: reply });
      }
      if (url.hostname === 'manage.pcln.top' && path === '/') {
        return new Response(null, { status: 302, headers: { location: new URL('/manage', url).href, 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
      }
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
      const response = await env.ASSETS.fetch(request);
      if (publisherLanding || path.startsWith('/publisher/') || url.hostname === 'manage.pcln.top' || path === '/manage' || path.startsWith('/manage/')) {
        const headers = new Headers(response.headers);
        headers.set('x-robots-tag', 'noindex, nofollow');
        headers.set('x-frame-options', 'DENY');
        headers.set('cache-control', 'no-store');
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      }
      return response;
    } catch {
      return Response.json({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: '服务暂时不可用' }, { status: 503, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
    }
  }
};
