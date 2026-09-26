export interface Session { id: string; name: string; email?: string | null; staff?: 0 | 1; developer?: 0 | 1; termsAccepted?: number; scope: 'console' | 'operations' }
export interface LinkedIdentity { provider: 'github' | 'microsoft' | 'google'; email?: string | null; created_at: string }
export interface PolicyStatus { kind: string; version: string; effectiveAt: string; contentHash: string; acceptedAt: string | null }
export interface DeletionRequest { id: string; state: 'pending' | 'cancelled' | 'finalized'; requestedAt: string; executeAfter?: number; cancelledAt?: string; finalizedAt?: string }
export interface PrivacyRequest { id: string; type: string; state: string; createdAt: string; updatedAt: string }
export interface Entitlements { cloudPlus: boolean; subscriptions: { subscription_id: string; status: string; price_id: string; product_id: string; scheduled_change_action: string | null }[] }
export interface StoreItem { id: string; name: string; summary: string; category: string; version: string; publisher: string; description: string }
export interface Ticket { id: string; subject: string; body: string; status: string; created_at: string; version: number }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

const AUTH_BASE = 'https://auth.pcln.top';
const POLICY_VERSION = '1.0';
let accessToken = '', currentUser: Session | undefined, restoring: Promise<Session | undefined> | undefined;

const authHeaders = (): Record<string, string> => accessToken ? { Authorization: 'Bearer ' + accessToken } : {};

async function authFetch(path: string, init: RequestInit = {}) {
  return fetch(AUTH_BASE + path, {
    ...init, credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Nexa-Request': '1', ...authHeaders(), ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Nexa-Request': '1', ...authHeaders(), ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
  if (response.status === 204) return undefined as T;
  if (!response.headers.get('content-type')?.match(/application\/(?:problem\+)?json/)) throw new Error('暂时无法连接平台服务，请稍后重试。');
  const body = await response.json();
  if (!response.ok) throw new ApiError(body.detail || body.message || `请求失败 (${response.status})`, response.status);
  return body as T;
}

export interface Page<T> { data: T[]; pagination: { limit: number; offset: number; total: number } }

// 访问令牌仅保存在内存中；页面刷新后用 auth 域 Cookie 会话静默换取新令牌。
async function mintToken(): Promise<Session | undefined> {
  const response = await authFetch('/auth/v1/tokens', { method: 'POST', body: '{}' });
  if (!response.ok) return undefined;
  const data = await response.json() as { token: string; user: { id: string; name: string; email?: string | null; staff?: 0 | 1; developer?: 0 | 1; termsAccepted?: number } };
  if (!data.token || !data.user?.id) return undefined;
  accessToken = data.token;
  currentUser = { ...data.user, scope: 'console' };
  return currentUser;
}

async function authJson<T>(response: Response | Promise<Response>, fallback: string): Promise<T> {
  const resolved = await response;
  if (!resolved.ok) {
    const body = await resolved.json().catch(() => ({ detail: '' }));
    throw new ApiError(body.detail || fallback, resolved.status);
  }
  return await resolved.json() as T;
}

export const platform = {
  oauthStart: (provider: 'github' | 'microsoft' | 'google', returnTo = '/account', mode: 'login' | 'link' = 'login') => {
    const target = new URL(`/auth/v1/oauth/${provider}/start`, AUTH_BASE);
    target.searchParams.set('return_to', returnTo);
    target.searchParams.set('mode', mode);
    target.searchParams.set('scope', 'console');
    if (mode === 'login') target.searchParams.set('tos', POLICY_VERSION);
    window.location.assign(target.toString());
  },
  session: () => {
    if (currentUser) return Promise.resolve(currentUser);
    restoring ??= mintToken().catch(() => undefined).finally(() => { restoring = undefined; });
    return restoring;
  },
  acceptPolicies: async () => {
    const result = await authJson<{ terms: { acceptedAt: string } }>(await authFetch('/auth/v1/policies/accept', { method: 'POST', body: '{}' }), '接受条款失败，请重试。');
    if (currentUser) currentUser.termsAccepted = 1;
    return result;
  },
  policiesStatus: () => authJson<{ policies: PolicyStatus[] }>(authFetch('/auth/v1/policies/status'), '暂时无法读取政策状态。'),
  identities: async () => {
    const response = await authFetch('/auth/v1/identities');
    if (!response.ok) throw new ApiError('暂时无法读取已关联的账号。', response.status);
    return await response.json() as { identities: LinkedIdentity[] };
  },
  unbind: async (provider: LinkedIdentity['provider']) => {
    const response = await authFetch('/auth/v1/identities/' + provider, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: '' }));
      throw new ApiError(body.detail || '解绑失败，请重试。', response.status);
    }
  },
  deletionStatus: () => authJson<{ request: DeletionRequest | null; cooldownDays: number }>(authFetch('/auth/v1/account/delete'), '暂时无法读取注销状态。'),
  requestDeletion: () => authJson<{ request: DeletionRequest }>(authFetch('/auth/v1/account/delete', { method: 'POST', body: '{}' }), '注销申请失败，请重试。'),
  cancelDeletion: () => authJson<{ ok: boolean }>(authFetch('/auth/v1/account/delete', { method: 'DELETE' }), '撤销注销失败，请重试。'),
  exportData: () => authJson<Record<string, unknown>>(authFetch('/auth/v1/account/export'), '数据导出失败，请重试。'),
  privacyRequests: () => authJson<{ requests: PrivacyRequest[] }>(authFetch('/auth/v1/privacy-requests'), '暂时无法读取隐私请求。'),
  createPrivacyRequest: (type: string) => authJson<{ request: PrivacyRequest }>(authFetch('/auth/v1/privacy-requests', { method: 'POST', body: JSON.stringify({ type }) }), '隐私请求提交失败，请重试。'),
  entitlements: () => request<Entitlements>('/billing/entitlements'),
  billingPortal: async () => {
    const result = await request<{ url: string }>('/billing/portal', { method: 'POST' });
    window.location.assign(result.url);
  },
  logout: async () => {
    try { await authFetch('/auth/v1/sessions/current?scope=console', { method: 'DELETE' }); } catch { /* 网络失败也要清除本地凭证 */ }
    accessToken = ''; currentUser = undefined;
  },
  catalog: (query: URLSearchParams) => request<Page<StoreItem>>('/resources?' + query),
  resource: (id: string) => request<StoreItem>('/resources/' + encodeURIComponent(id)),
  tickets: (scope: string, offset=0) => request<Page<Ticket>>(`/tickets?scope=${scope}&limit=50&offset=${offset}`),
  createTicket: (subject: string, body: string) => request('/tickets', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  resolve: (ticket: Ticket) => request(`/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', headers: { 'If-Match': '"' + ticket.version + '"' }, body: JSON.stringify({ status: 'resolved' }) })
};
