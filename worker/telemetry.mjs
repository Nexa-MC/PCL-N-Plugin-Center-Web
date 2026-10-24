// Native clients cannot complete browser challenges on the website zone. This
// narrow gateway shares the API's anonymous schema/rate limit, never its account routes.
const problem = (status, detail, headers = {}) => Response.json({ type: 'about:blank', status, title: 'Request failed', detail },
  { status, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store', ...headers } });

async function liveWebhook(request, env) {
  const headers = { 'x-nexa-webhook': 'waffo-live' };
  const error = (status, detail, extra = {}) => problem(status, detail, { ...headers, ...extra });
  if (request.method !== 'POST') return error(405, 'webhook_post_required', { allow: 'POST' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return error(415, 'waffo_raw_json_required');
  const signature = request.headers.get('x-waffo-signature');
  if (!signature) return error(401, 'waffo_live_signature_required');
  if (Number(request.headers.get('content-length')) > 65536) return error(413, 'webhook_body_too_large');
  const unavailable = () => error(503, 'waffo_live_handler_unavailable', { 'retry-after': '30' });
  if (!env.API) return unavailable();
  try {
    // Preserve signed bytes; this public gateway never holds the merchant key
    // or grants browser/user authority. The API verifies the production RSA key.
    const forwarded = new Request('https://nexa-api.internal/api/webhooks/waffo-live', new Request(request, {
      headers: { 'content-type': request.headers.get('content-type'), 'x-waffo-signature': signature }, redirect: 'manual'
    }));
    const response = await env.API.fetch(forwarded);
    if (response.status === 404 || response.status >= 300 && response.status < 400 || response.headers.get('content-type')?.includes('text/html')) return unavailable();
    const reply = new Headers(response.headers);
    reply.delete('set-cookie'); reply.delete('location'); reply.set('cache-control', 'no-store'); reply.set('x-nexa-webhook', 'waffo-live');
    return new Response(response.body, { status: response.status, headers: reply });
  } catch { return unavailable(); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/webhooks/wp_wh/live' && !url.search) return liveWebhook(request, env);
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
