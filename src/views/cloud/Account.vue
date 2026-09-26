<template>
  <p v-if="checking" class="empty-state" role="status">正在检查会话…</p>
  <div v-else-if="session && !session.termsAccepted" class="account-panel">
    <section class="work-panel accept-panel">
      <span class="status-pill">需要确认</span>
      <h2>接受《Nexa Cloud 服务条款 v1.0》</h2>
      <p>在继续使用账户功能前，请阅读并接受当前生效的服务条款。《<router-link to="/legal/privacy">隐私政策</router-link>》说明了数据处理方式，将随接受一并记录。</p>
      <label class="accept-check"><input type="checkbox" v-model="acceptChecked" />我已阅读并接受《<router-link to="/legal/terms">Nexa Cloud 服务条款 v1.0</router-link>》，并知悉《隐私政策》的内容。</label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="primary-button" :disabled="busy || !acceptChecked" @click="accept">接受并继续</button>
    </section>
  </div>
  <div v-else-if="session" class="account-layout">
    <nav class="account-nav" aria-label="账户分类">
      <button v-for="item in navItems" :key="item.key" type="button" :class="{ active: section === item.key }" @click="section = item.key"><span class="nav-icon" :style="{ background: item.color }" aria-hidden="true">{{ item.icon }}</span>{{ item.label }}</button>
    </nav>
    <div class="account-panel">
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>

      <template v-if="section === 'overview'">
        <section class="work-panel"><div class="overview-hero"><span class="overview-avatar" aria-hidden="true">{{ (session.name || 'N')[0].toUpperCase() }}</span><div><p class="eyebrow">ACCOUNT</p><h1>{{ session.name }}</h1><p class="overview-mail">{{ session.email || '第三方身份账户' }}</p><span class="status-pill">已登录</span></div></div><div class="shortcut-grid"><button v-for="item in navItems.filter(i => i.key !== 'overview')" :key="item.key" type="button" @click="section = item.key"><span class="nav-icon" :style="{ background: item.color }" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span></button></div></section>
        <section class="work-panel"><h2>会话</h2><p>登录状态 24 小时内有效。退出后会注销该账户在所有设备上的会话。</p><button class="danger-button" :disabled="busy" @click="logout">退出登录</button></section>
      </template>

      <template v-else-if="section === 'linked'">
        <section class="work-panel"><h2>关联的账号</h2><p>同一个账户可以同时关联 GitHub、Google 和 Microsoft，即使邮箱不同也可以互绑。至少需要保留一个登录方式。</p><div v-for="p in providers" :key="p.id" class="identity-row"><span class="identity-icon" aria-hidden="true">{{ p.icon }}</span><div class="meta"><h3>{{ p.name }}</h3><small v-if="bound(p.id)">{{ identityMail(p.id) }} · 已关联</small><small v-else>尚未关联</small></div><button v-if="!bound(p.id)" class="secondary-button" :disabled="busy" @click="bind(p.id)">关联 {{ p.name }}</button><button v-else-if="identities && identities.length > 1" class="danger-button" :disabled="busy" @click="unbind(p.id)">解除关联</button><span v-else class="status-pill">唯一登录方式</span></div></section>
      </template>

      <template v-else-if="section === 'security'">
        <section class="work-panel"><h2>安全性与登录</h2><div class="profile-row"><span>登录方式</span><strong>仅第三方 OAuth（GitHub / Google / Microsoft）</strong></div><div class="profile-row"><span>会话有效期</span><strong>24 小时</strong></div><div class="profile-row"><span>凭证存储</span><strong>访问令牌仅保存在浏览器内存，刷新后自动换取</strong></div><p>“退出所有设备”会注销该账户当前范围内的全部会话，包括其他浏览器和已换取的访问令牌。</p><button class="danger-button" :disabled="busy" @click="logout">退出所有设备</button></section>
      </template>

      <template v-else-if="section === 'privacy'">
        <section class="work-panel"><h2>政策接受状态</h2><template v-if="policies.length"><div v-for="p in policies" :key="p.kind" class="profile-row"><span>{{ p.kind === 'terms' ? '服务条款' : '隐私政策' }} v{{ p.version }}</span><strong>{{ p.acceptedAt ? `已接受 · ${new Date(p.acceptedAt).toLocaleString()}` : '未接受' }}</strong></div><p class="legal-hashes">文档哈希（SHA-256）：{{ policies.map(p => `${p.kind}:${p.contentHash.slice(0, 16)}…`).join('　') }}</p></template><p v-else>正在读取…</p><p>历史版本见 <router-link to="/legal">法律文档索引</router-link>。</p></section>
        <section class="work-panel"><h2>数据导出</h2><p>导出账户资料、关联身份、会话状态、政策接受与隐私请求记录（JSON，不含凭据与哈希）。</p><button class="primary-button" :disabled="busy" @click="exportData">下载我的数据</button></section>
        <section class="work-panel"><h2>隐私请求</h2><p>根据《隐私政策》第 11 条，你可以在此提交查阅、更正、删除、可携带、限制或异议请求，我们会通过 privacy@pcln.top 处理。</p><label class="privacy-select">请求类型<select v-model="privacyType"><option value="access">查阅 / 复制</option><option value="correction">更正 / 补充</option><option value="portability">数据可携带副本</option><option value="objection">限制或异议</option><option value="other">其他</option></select></label><button class="secondary-button" :disabled="busy" @click="submitPrivacy">提交请求</button><div v-if="privacyList.length" class="privacy-list"><div v-for="r in privacyList" :key="r.id" class="profile-row"><span>{{ privacyLabel(r.type) }} · {{ new Date(r.createdAt).toLocaleDateString() }}</span><span class="status-pill">{{ privacyState(r.state) }}</span></div></div></section>
      </template>

      <template v-else-if="section === 'delete'">
        <section class="work-panel"><h2>删除账户</h2><template v-if="deletion && deletion.state === 'pending'"><span class="status-pill">注销已申请</span><p>注销将于 <strong>{{ new Date(deletion.executeAfter || 0).toLocaleString() }}</strong> 生效（7 天冷静期）。在此之前登录并撤销，即可取消注销。</p><button class="danger-button" :disabled="busy" @click="cancelDeletion">撤销注销申请</button></template><template v-else-if="deletion && deletion.state === 'finalized'"><span class="status-pill">已注销</span><p>该账户已完成注销，个人资料已删除或匿名化。此页面仅为记录。</p></template><template v-else><p>注销申请设有 <strong>7 天冷静期</strong>。生效后将撤销全部会话、解绑第三方身份、删除或匿名化账户资料；依法需要保留的记录将与普通账户分离受限保存。与组织或发布资源相关的关系将转移至不可登录的系统保管主体，资源立即下架。</p><label class="delete-confirm">输入账户名 <strong>{{ session.name }}</strong> 以确认<input v-model="deleteConfirm" :placeholder="session.name" /></label><p v-if="deleteError" class="form-error" role="alert">{{ deleteError }}</p><button class="danger-button" :disabled="busy || deleteConfirm !== session.name" @click="requestDeletion">申请删除账户</button></template></section>
      </template>

      <template v-else-if="section === 'tickets'">
        <section class="work-panel"><div class="section-heading"><div><h2>支持工单</h2></div><button class="secondary-button" :disabled="busy" @click="loadTickets">刷新</button></div><div class="category-tabs"><button :class="{active: !showResolved}" @click="showResolved = false">待处理</button><button :class="{active: showResolved}" @click="showResolved = true">已解决</button></div><div v-if="ticketsLoaded && !visibleTickets.length" class="empty-state"><h3>{{ showResolved ? '还没有已解决的请求' : '暂无待办' }}</h3></div><article v-for="ticket in visibleTickets" :key="ticket.id" class="ticket-row"><div><small>{{ new Date(ticket.created_at).toLocaleString() }}</small><h3>{{ ticket.subject }}</h3><p>{{ ticket.body }}</p></div><span class="status-pill">{{ ticket.status === 'open' ? '待处理' : '已解决' }}</span></article><div class="pagination" v-if="total > 50"><button class="secondary-button" :disabled="offset === 0 || busy" @click="offset -= 50; loadTickets()">上一页</button><span>{{ offset + 1 }}–{{ Math.min(offset + 50, total) }} / {{ total }}</span><button class="secondary-button" :disabled="offset + 50 >= total || busy" @click="offset += 50; loadTickets()">下一页</button></div></section>
        <form class="work-panel support-form" @submit.prevent="submit"><h2>新建工单</h2><label>标题<input v-model="subject" required maxlength="120" /></label><label>详细说明<textarea v-model="body" required maxlength="4000" rows="4" /></label><button class="primary-button" :disabled="busy">提交</button><span v-if="message" class="form-success" role="status">{{ message }}</span></form>
      </template>

      <template v-else-if="section === 'profile'">
        <section class="work-panel"><h2>个人信息</h2><div class="profile-row"><span>账户名</span><strong>{{ session.name }}</strong></div><div class="profile-row"><span>邮箱</span><strong>{{ session.email || '未提供' }}</strong></div><div class="profile-row"><span>账户 ID</span><strong>{{ session.id }}</strong></div><p>基础信息来自第三方身份提供商，在此只读展示。修改账户名等功能将在后续版本开放。</p></section>
      </template>

      <template v-else-if="section === 'wallet'">
        <section class="work-panel"><h2>钱包与订阅</h2><div class="profile-row"><span>Cloud+</span><strong>{{ entitlements ? (entitlements.cloudPlus ? '已激活' : '未激活') : '正在读取…' }}</strong></div><p v-if="entitlements && !entitlements.cloudPlus" class="hint">订阅权益由 Paddle 事件实时同步；完成订阅后几秒内生效。</p><p v-if="entitlements?.subscriptions.some(s => s.scheduled_change_action)" class="hint">注意：当前订阅存在待生效的变更（如已排期取消），在变更生效前权益仍可用。</p><div class="actions"><router-link class="primary-button" to="/pricing">查看套餐与价格</router-link><button class="secondary-button" :disabled="busy" @click="openPortal">管理订阅</button></div><p v-if="portalError" class="form-error" role="alert">{{ portalError }}</p><p class="login-fine">支付方式更新、取消与发票在 Paddle 客户门户完成；取消与退款适用 <router-link to="/legal/refunds">退款政策</router-link>。</p></section>
      </template>

      <template v-else-if="section === 'developer'">
        <section v-if="session.developer" class="work-panel"><span class="status-pill">已具备资格</span><h2>开发者管理控制台</h2><p>发布者工作空间、资源提交与管理功能正在接入，入口将在此开放。</p></section>
        <section v-else class="work-panel"><h2>申请开发者资格</h2><p>获得资格后可以创建发布者组织并提交插件、界面资源与模板。审批流程即将开放，届时可直接在此提交申请。</p><button class="primary-button" disabled>申请入口即将开放</button></section>
      </template>

      <template v-else-if="section === 'website'">
        <section v-if="session.staff" class="work-panel"><span class="status-pill">已具备资格</span><h2>网站后台管理</h2><p>统一待办、遥测与诊断等运营功能正在回归，后台入口将在此开放。</p></section>
        <section v-else class="work-panel"><h2>申请网站管理员</h2><p>网站管理员负责处理支持工单、运营待办与平台诊断。申请通道即将开放，届时可直接在此提交申请。</p><button class="primary-button" disabled>申请入口即将开放</button></section>
      </template>
    </div>
  </div>
  <div v-else class="login-hero">
    <div class="login-card">
      <span class="login-mark" aria-hidden="true">N</span>
      <h2>登录 Nexa Cloud</h2>
      <p class="login-sub">使用 GitHub、Google 或 Microsoft 账户继续，平台不提供邮箱注册。</p>
      <label class="accept-check"><input type="checkbox" v-model="tosRead" /><span>我已阅读并接受《<router-link to="/legal/terms">服务条款 v1.0</router-link>》与《<router-link to="/legal/privacy">隐私政策 v1.0</router-link>》</span></label>
      <div class="login-providers">
        <button class="provider-button github" :disabled="busy || !tosRead" @click="oauth('github')"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>使用 GitHub 继续</span></button>
        <button class="provider-button google" :disabled="busy || !tosRead" @click="oauth('google')"><svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>使用 Google 继续</span></button>
        <button class="provider-button microsoft" :disabled="busy || !tosRead" @click="oauth('microsoft')"><svg viewBox="0 0 23 23" width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg><span>使用 Microsoft 继续</span></button>
      </div>
      <p v-if="error || oauthError" class="form-error" role="alert">{{ oauthError || error }}</p>
      <p class="login-fine">账户与会话由 auth.pcln.top 提供，一个账户可同时绑定 GitHub、Google 与 Microsoft。</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { platform, ApiError, type Session, type Ticket, type LinkedIdentity, type PolicyStatus, type DeletionRequest, type PrivacyRequest, type Entitlements } from '@/api/platform';
const route = useRoute();
const session = ref<Session>(), checking = ref(true), busy = ref(false), error = ref('');
const oauthError = computed(() => { const value = route.query.oauth_error; return typeof value === 'string' && value ? value : ''; });
const tosRead = ref(false), acceptChecked = ref(false);
function oauth(provider:'github'|'microsoft'|'google'){ busy.value=true; platform.oauthStart(provider, '/account', 'login'); }
async function accept(){ busy.value = true; error.value = ''; try { await platform.acceptPolicies(); session.value = { ...session.value!, termsAccepted: 1 }; } catch (e) { error.value = e instanceof ApiError ? e.message : '接受条款失败，请重试。'; } finally { busy.value = false; } }
async function logout(){ busy.value=true; error.value=''; await platform.logout(); session.value=undefined; busy.value=false; }

const navItems = [
  { key: 'overview', label: '概览', icon: '⌂', color: '#1a73e8' },
  { key: 'linked', label: '关联的账号', icon: '⇄', color: '#1e8e3e' },
  { key: 'security', label: '安全性与登录', icon: '•••', color: '#f2a100' },
  { key: 'profile', label: '个人信息', icon: '◉', color: '#9334e6' },
  { key: 'privacy', label: '隐私与数据', icon: '◇', color: '#00897b' },
  { key: 'wallet', label: '钱包与订阅', icon: '¤', color: '#c5221f' },
  { key: 'tickets', label: '支持工单', icon: '✉', color: '#12a5af' },
  { key: 'developer', label: '开发者控制台', icon: '</>', color: '#3f51b5' },
  { key: 'website', label: '网站管理', icon: '⚙', color: '#e8546e' },
  { key: 'delete', label: '删除账户', icon: '✕', color: '#5f6368' }
];
const validSections = navItems.map(i => i.key);
const section = ref(validSections.includes(String(route.query.section)) ? String(route.query.section) : 'overview');
watch(() => route.query.section, value => { if (validSections.includes(String(value))) section.value = String(value); });
watch(section, value => {
  if (value === 'tickets' && !ticketsLoaded.value) void loadTickets();
  if (value === 'privacy') { void loadPolicies(); void loadPrivacy(); }
  if (value === 'delete') void loadDeletion();
  if (value === 'wallet') void loadEntitlements();
});

const providers = [
  { id: 'github', name: 'GitHub', icon: '' },
  { id: 'google', name: 'Google', icon: 'G' },
  { id: 'microsoft', name: 'Microsoft', icon: '⊞' }
] as const;
const identities = ref<LinkedIdentity[]>();
const bound = (id: LinkedIdentity['provider']) => Boolean(identities.value?.some(i => i.provider === id));
const identityMail = (id: LinkedIdentity['provider']) => identities.value?.find(i => i.provider === id)?.email || '已关联';
async function loadIdentities(){ try { identities.value = (await platform.identities()).identities; } catch (e) { error.value = e instanceof Error ? e.message : '暂时无法读取已关联的账号。'; } }
async function bind(id: LinkedIdentity['provider']){ busy.value = true; platform.oauthStart(id, '/account?section=linked', 'link'); }
async function unbind(id: LinkedIdentity['provider']){ busy.value = true; error.value = ''; try { await platform.unbind(id); await loadIdentities(); } catch (e) { error.value = e instanceof ApiError ? e.message : '解绑失败，请重试。'; } finally { busy.value = false; } }

const policies = ref<PolicyStatus[]>([]);
async function loadPolicies(){ try { policies.value = (await platform.policiesStatus()).policies; } catch { /* 状态读取失败不阻塞 */ } }
const privacyType = ref('access'), privacyList = ref<PrivacyRequest[]>([]);
const privacyLabel = (type: string) => ({ access: '查阅 / 复制', correction: '更正 / 补充', deletion: '删除', portability: '数据可携带', objection: '限制或异议', other: '其他' }[type] || type);
const privacyState = (state: string) => ({ received: '已收到', verified: '已验证', processing: '处理中', completed: '已完成', rejected: '已拒绝' }[state] || state);
async function loadPrivacy(){ try { privacyList.value = (await platform.privacyRequests()).requests; } catch { /* 忽略 */ } }
async function submitPrivacy(){ busy.value = true; error.value = ''; try { await platform.createPrivacyRequest(privacyType.value); await loadPrivacy(); } catch (e) { error.value = e instanceof ApiError ? e.message : '提交失败，请重试。'; } finally { busy.value = false; } }
async function exportData(){ busy.value = true; try { const data = await platform.exportData(); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `nexa-account-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); } catch (e) { error.value = e instanceof ApiError ? e.message : '导出失败，请重试。'; } finally { busy.value = false; } }

const deletion = ref<DeletionRequest | null>(), deleteConfirm = ref(''), deleteError = ref('');
const entitlements = ref<Entitlements | null>(), portalError = ref('');
async function loadEntitlements(){ try { entitlements.value = await platform.entitlements(); } catch (e) { portalError.value = e instanceof ApiError ? e.message : '暂时无法读取订阅状态。'; } }
async function openPortal(){ busy.value = true; portalError.value = ''; try { await platform.billingPortal(); } catch (e) { portalError.value = e instanceof ApiError ? e.message : '暂时无法打开订阅管理，请稍后重试。'; busy.value = false; } }
async function loadDeletion(){ try { deletion.value = (await platform.deletionStatus()).request; } catch { /* 忽略 */ } }
async function requestDeletion(){ busy.value = true; deleteError.value = ''; try { deletion.value = (await platform.requestDeletion()).request; deleteConfirm.value = ''; } catch (e) { deleteError.value = e instanceof ApiError ? e.message : '申请失败，请重试。'; } finally { busy.value = false; } }
async function cancelDeletion(){ busy.value = true; deleteError.value = ''; try { await platform.cancelDeletion(); deletion.value = null; } catch (e) { deleteError.value = e instanceof ApiError ? e.message : '撤销失败，请重试。'; } finally { busy.value = false; } }

const tickets = ref<Ticket[]>([]), ticketsLoaded = ref(false), showResolved = ref(false), subject = ref(''), body = ref(''), message = ref('');
const offset = ref(0), total = ref(0);
const visibleTickets = computed(() => tickets.value.filter(t => showResolved.value ? t.status === 'resolved' : t.status === 'open'));
async function loadTickets(){ busy.value = true; error.value = ''; try { const result = await platform.tickets('console', offset.value); tickets.value = result.data; total.value = result.pagination.total; ticketsLoaded.value = true; } catch (e) { error.value = e instanceof Error ? e.message : '操作失败，请重试。'; } finally { busy.value = false; } }
async function submit(){ busy.value = true; error.value = ''; message.value = ''; try { await platform.createTicket(subject.value, body.value); subject.value = ''; body.value = ''; message.value = '请求已提交。'; showResolved.value = false; await loadTickets(); } catch (e) { error.value = e instanceof Error ? e.message : '操作失败，请重试。'; } finally { busy.value = false; } }

onMounted(async () => {
  session.value = await platform.session();
  checking.value = false;
  if (session.value) {
    void loadIdentities();
    if (section.value === 'tickets') void loadTickets();
    if (section.value === 'privacy') { void loadPolicies(); void loadPrivacy(); }
    if (section.value === 'delete') void loadDeletion();
    if (section.value === 'wallet') void loadEntitlements();
  }
});
</script>
