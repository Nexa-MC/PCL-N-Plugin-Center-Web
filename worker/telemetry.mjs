// Native clients cannot complete browser challenges on the website zone. This
// narrow gateway shares the API's anonymous schema/rate limit, never its account routes.
const problem = (status, detail, headers = {}) => Response.json({ type: 'about:blank', status, title: 'Request failed', detail },
  { status, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store', ...headers } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/v1/events' || url.search) return problem(404, '接口不存在');
    if (request.method !== 'POST') return problem(405, '方法不支持', { allow: 'POST' });
    // Do not grant credentials or browser authority through an anonymous ingress.
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) headers.set('cf-connecting-ip', ip); // Cloudflare's edge value, used only by API rate limits.
    try {
      const forwarded = new Request('https://nexa-api.internal/api/v1/telemetry/events', request);
      return await env.API.fetch(new Request(forwarded, { headers, redirect: 'manual' }));
    } catch {
      return problem(503, '遥测服务暂时不可用');
    }
  }
};
