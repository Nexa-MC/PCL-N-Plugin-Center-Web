export interface Session { id: string; name: string; email?: string | null; staff?: 0 | 1; developer?: 0 | 1; termsAccepted?: number; scope: 'console' | 'operations' }
export interface LinkedIdentity { provider: 'github' | 'microsoft' | 'google'; email?: string | null; created_at: string }
export interface PolicyStatus { kind: string; version: string; effectiveAt: string; contentHash: string; acceptedAt: string | null }
export interface DeletionRequest { id: string; state: 'pending' | 'cancelled' | 'finalized'; requestedAt: string; executeAfter?: number; cancelledAt: string | null; finalizedAt: string | null }
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

// ---------- 仅前端测试账户（控制台输入 test_login() / test_logout()） ----------
// 只写本地内存 UI 状态：不签发真实令牌、不请求后端、不获得任何真实权限。
// 刷新页面即消失；所有真实接口仍然只信任服务端会话。
let testSession: Session | undefined;
const testState = {
  identities: [] as LinkedIdentity[],
  tickets: [] as Ticket[],
  privacy: [] as PrivacyRequest[],
  deletion: null as DeletionRequest | null,
  entitlements: {
    cloudPlus: true,
    subscriptions: [{ subscription_id: 'sub_local_test', status: 'active', price_id: 'pri_local_test', product_id: 'pro_cloud_plus', scheduled_change_action: null }]
  } as Entitlements
};
const testNow = () => new Date().toISOString();
const isTest = () => testSession !== undefined;

export function testLogin(overrides: Partial<Session> = {}): Session {
  testSession = { id: 'local-test', name: 'Test', email: 'test@local.dev', staff: 0, developer: 0, termsAccepted: 1, scope: 'console', ...overrides };
  testState.identities = [{ provider: 'github', email: testSession.email, created_at: testNow() }];
  testState.tickets = [{ id: 'ticket-local-1', subject: '示例支持请求', body: '这是仅前端的测试数据，可用来预览工单闭环。', status: 'open', created_at: testNow(), version: 1 }];
  testState.privacy = [];
  testState.deletion = null;
  accessToken = ''; currentUser = testSession; restoring = undefined;
  console.info('%c Nexa Cloud %c 已进入前端测试账户「Test」。仅本地 UI 状态，无后端权限，刷新即失效。test_logout() 退出；test_login({ staff: 1 }) 可模拟工作人员。', 'background:#1673e6;color:#fff;border-radius:4px 0 0 4px;padding:1px 6px', 'background:#e8f0fe;color:#0f5ecb;border-radius:0 4px 4px 0;padding:1px 6px');
  window.dispatchEvent(new Event('focus')); // 让 CloudShell 立即刷新登录态
  return testSession;
}

export function testLogout(): void {
  testSession = undefined; currentUser = undefined; accessToken = ''; restoring = undefined;
  console.info('已退出前端测试账户。');
  window.dispatchEvent(new Event('focus'));
}

const testPolicyFixtures = (): PolicyStatus[] => {
  const acceptedAt = testSession?.termsAccepted ? '2026-09-26T08:00:00.000Z' : null;
  return [
    { kind: 'terms', version: POLICY_VERSION, effectiveAt: '2026-09-26T00:00:00.000Z', contentHash: '0123456789abcdef'.repeat(4), acceptedAt },
    { kind: 'privacy', version: POLICY_VERSION, effectiveAt: '2026-09-26T00:00:00.000Z', contentHash: 'abcdef0123456789'.repeat(4), acceptedAt }
  ];
};

export const platform = {
  oauthStart: (provider: 'github' | 'microsoft' | 'google', returnTo = '/account', mode: 'login' | 'link' = 'login') => {
    if (isTest()) {
      if (mode === 'link' && !testState.identities.some(i => i.provider === provider)) testState.identities.push({ provider, email: testSession?.email ?? null, created_at: testNow() });
      console.info(`[test] 已模拟 ${provider} ${mode === 'link' ? '关联' : '登录'}，未离开页面。`);
      return;
    }
    const target = new URL(`/auth/v1/oauth/${provider}/start`, AUTH_BASE);
    target.searchParams.set('return_to', returnTo);
    target.searchParams.set('mode', mode);
    target.searchParams.set('scope', 'console');
    if (mode === 'login') target.searchParams.set('tos', POLICY_VERSION);
    window.location.assign(target.toString());
  },
  session: () => {
    if (testSession) return Promise.resolve(testSession);
    if (currentUser) return Promise.resolve(currentUser);
    restoring ??= mintToken().catch(() => undefined).finally(() => { restoring = undefined; });
    return restoring;
  },
  acceptPolicies: async () => {
    if (isTest()) { if (testSession) testSession.termsAccepted = 1; return { terms: { acceptedAt: testNow() } }; }
    const result = await authJson<{ terms: { acceptedAt: string } }>(await authFetch('/auth/v1/policies/accept', { method: 'POST', body: '{}' }), '接受条款失败，请重试。');
    if (currentUser) currentUser.termsAccepted = 1;
    return result;
  },
  policiesStatus: async () => {
    if (isTest()) return { policies: testPolicyFixtures() };
    return authJson<{ policies: PolicyStatus[] }>(authFetch('/auth/v1/policies/status'), '暂时无法读取政策状态。');
  },
  identities: async () => {
    if (isTest()) return { identities: [...testState.identities] };
    const response = await authFetch('/auth/v1/identities');
    if (!response.ok) throw new ApiError('暂时无法读取已关联的账号。', response.status);
    return await response.json() as { identities: LinkedIdentity[] };
  },
  unbind: async (provider: LinkedIdentity['provider']) => {
    if (isTest()) { testState.identities = testState.identities.filter(i => i.provider !== provider); return; }
    const response = await authFetch('/auth/v1/identities/' + provider, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: '' }));
      throw new ApiError(body.detail || '解绑失败，请重试。', response.status);
    }
  },
  deletionStatus: async () => {
    if (isTest()) return { request: testState.deletion, cooldownDays: 7 };
    return authJson<{ request: DeletionRequest | null; cooldownDays: number }>(authFetch('/auth/v1/account/delete'), '暂时无法读取注销状态。');
  },
  requestDeletion: async () => {
    if (isTest()) {
      testState.deletion = { id: 'del-local', state: 'pending', requestedAt: testNow(), executeAfter: Date.now() + 7 * 864e5, cancelledAt: null, finalizedAt: null };
      return { request: testState.deletion };
    }
    return authJson<{ request: DeletionRequest }>(authFetch('/auth/v1/account/delete', { method: 'POST', body: '{}' }), '注销申请失败，请重试。');
  },
  cancelDeletion: async () => {
    if (isTest()) { if (testState.deletion) { testState.deletion.state = 'cancelled'; testState.deletion.cancelledAt = testNow(); } return { ok: true }; }
    return authJson<{ ok: boolean }>(authFetch('/auth/v1/account/delete', { method: 'DELETE' }), '撤销注销失败，请重试。');
  },
  exportData: async () => {
    if (isTest()) return { account: testSession, identities: testState.identities, tickets: testState.tickets, privacyRequests: testState.privacy, note: '仅前端测试数据' } as Record<string, unknown>;
    return authJson<Record<string, unknown>>(authFetch('/auth/v1/account/export'), '数据导出失败，请重试。');
  },
  privacyRequests: async () => {
    if (isTest()) return { requests: [...testState.privacy] };
    return authJson<{ requests: PrivacyRequest[] }>(authFetch('/auth/v1/privacy-requests'), '暂时无法读取隐私请求。');
  },
  createPrivacyRequest: async (type: string) => {
    if (isTest()) {
      const entry: PrivacyRequest = { id: 'pr-local-' + (testState.privacy.length + 1), type, state: 'pending', createdAt: testNow(), updatedAt: testNow() };
      testState.privacy.push(entry);
      return { request: entry };
    }
    return authJson<{ request: PrivacyRequest }>(authFetch('/auth/v1/privacy-requests', { method: 'POST', body: JSON.stringify({ type }) }), '隐私请求提交失败，请重试。');
  },
  entitlements: async () => {
    if (isTest()) return testState.entitlements;
    return request<Entitlements>('/billing/entitlements');
  },
  billingPortal: async () => {
    if (isTest()) { console.info('[test] 测试模式不打开支付门户。'); return; }
    const result = await request<{ url: string }>('/billing/portal', { method: 'POST' });
    window.location.assign(result.url);
  },
  logout: async () => {
    if (isTest()) { testLogout(); return; }
    try { await authFetch('/auth/v1/sessions/current?scope=console', { method: 'DELETE' }); } catch { /* 网络失败也要清除本地凭证 */ }
    accessToken = ''; currentUser = undefined;
  },
  catalog: (query: URLSearchParams) => request<Page<StoreItem>>('/resources?' + query),
  resource: (id: string) => request<StoreItem>('/resources/' + encodeURIComponent(id)),
  tickets: async (scope: string, offset = 0) => {
    if (isTest()) {
      const data = testState.tickets.slice(offset, offset + 50);
      return { data, pagination: { limit: 50, offset, total: testState.tickets.length } } as Page<Ticket>;
    }
    return request<Page<Ticket>>(`/tickets?scope=${scope}&limit=50&offset=${offset}`);
  },
  createTicket: async (subject: string, body: string) => {
    if (isTest()) { testState.tickets.unshift({ id: 'ticket-local-' + Date.now(), subject, body, status: 'open', created_at: testNow(), version: 1 }); return {}; }
    return request('/tickets', { method: 'POST', body: JSON.stringify({ subject, body }) });
  },
  resolve: async (ticket: Ticket) => {
    if (isTest()) { const target = testState.tickets.find(t => t.id === ticket.id); if (target) { target.status = 'resolved'; target.version += 1; } return {}; }
    return request(`/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', headers: { 'If-Match': '"' + ticket.version + '"' }, body: JSON.stringify({ status: 'resolved' }) });
  }
};
