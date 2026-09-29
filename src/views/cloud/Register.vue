<template>
  <div class="login-page">
    <header class="login-topbar">
      <router-link class="login-brand" to="/"><strong>NexaCL</strong></router-link>
    </header>
    <main class="login-hero">
      <p v-if="checking" class="empty-state" role="status">正在检查会话…</p>
      <div v-else class="login-card">
        <span class="login-mark" aria-hidden="true">N</span>
        <p class="eyebrow card-eyebrow">NEXACL ID</p>

        <!-- 第一步:第三方身份验证(注册的必要前置) -->
        <template v-if="!setupSession">
          <h2>创建账户</h2>
          <p class="login-sub">先验证一个第三方身份</p>
          <label class="accept-check"><input type="checkbox" v-model="tosRead" /><span>我已阅读并接受《<router-link to="/legal/terms">服务条款 v1.0</router-link>》与《<router-link to="/legal/privacy">隐私政策 v1.0</router-link>》</span></label>
          <div class="login-providers">
            <button class="provider-button github" :disabled="busy || !tosRead" @click="oauth('github')"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>GitHub</span></button>
            <button class="provider-button google" :disabled="busy || !tosRead" @click="oauth('google')"><svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Google</span></button>
            <button class="provider-button microsoft" :disabled="busy || !tosRead" @click="oauth('microsoft')"><svg viewBox="0 0 23 23" width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg><span>Microsoft</span></button>
          </div>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <p class="form-switch">已有账户？<router-link to="/login">直接登录</router-link></p>
        </template>

        <!-- 第二步:回调后完善资料(用户名 / 用户 ID / 可选密码 + 验证器) -->
        <template v-else>
          <h2>完善账户资料</h2>
          <p class="login-sub">身份已验证 · {{ setupSession.name }}</p>
          <form class="credential-form" @submit.prevent="submitComplete">
            <label>用户名<input v-model.trim="name" maxlength="60" required placeholder="1–60 个字符" /></label>
            <label>用户 ID<input v-model.trim="handle" minlength="6" maxlength="20" required pattern="[A-Za-z][A-Za-z0-9_-]{5,19}" placeholder="6–20 位，字母开头，用于登录" @blur="checkHandle" /></label>
            <p v-if="handleHint" class="login-fine" role="status">{{ handleHint }}</p>
            <label class="accept-check"><input type="checkbox" v-model="wantPassword" :disabled="totpLoading" /><span>设置密码（启用「用户 ID + 密码」登录，需绑定验证器应用）</span></label>
            <template v-if="wantPassword">
              <label>密码<input v-model="password" type="password" minlength="14" maxlength="256" autocomplete="new-password" placeholder="至少 14 位" /></label>
              <label>确认密码<input v-model="password2" type="password" minlength="14" maxlength="256" autocomplete="new-password" /></label>
              <p v-if="totpLoading" class="login-fine" role="status">正在生成验证器密钥…</p>
              <template v-else-if="totp">
                <p class="secret-box"><code>{{ totp.secret }}</code><button class="secondary-button" type="button" @click="copySecret">复制</button></p>
                <p class="login-fine break-all">{{ totp.otpauthUrl }}</p>
                <span class="seg-label">验证器应用显示的 6 位动态码</span>
                <SegmentedCode v-model="totpCode" :length="6" charset="digits" label="验证器动态码" :disabled="busy" />
              </template>
            </template>
            <p v-if="error" class="form-error" role="alert">{{ error }}</p>
            <button class="primary-button" type="submit" :disabled="busy || !canSubmit">{{ busy ? '正在创建…' : '完成注册' }}</button>
          </form>
        </template>
      </div>
      <nav class="login-footer" aria-label="页脚">
        <router-link to="/download">下载</router-link>
        <router-link to="/changelog">更新日志</router-link>
        <router-link to="/legal/terms">服务条款</router-link>
        <router-link to="/legal/privacy">隐私政策</router-link>
      </nav>
    </main>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { platform, type Session } from '@/api/platform';
import SegmentedCode from '@/components/SegmentedCode.vue';
import { applyPageSeo } from '@/utils/seo';

const router = useRouter();
const checking = ref(true), busy = ref(false), error = ref(''), tosRead = ref(false);
// 第三方验证完成后,服务端签发会话并回跳到此页;setupRequired 的会话进入完善资料步骤。
const setupSession = ref<Session | null>(null);
const name = ref(''), handle = ref(''), handleHint = ref('');
const wantPassword = ref(false), password = ref(''), password2 = ref('');
const totp = ref<{ id: string; secret: string; otpauthUrl: string } | null>(null), totpCode = ref(''), totpLoading = ref(false);

const HANDLE_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{5,19}$/;
const canSubmit = computed(() => Boolean(name.value) && HANDLE_PATTERN.test(handle.value)
  && (!wantPassword.value || (password.value.length >= 14 && password.value === password2.value && Boolean(totp.value) && totpCode.value.length === 6)));

function oauth(provider: 'github' | 'microsoft' | 'google') { busy.value = true; platform.oauthStart(provider, '/register?setup=1', 'login'); }
async function checkHandle() {
  handleHint.value = '';
  const value = handle.value.trim();
  if (!value) return;
  try {
    const result = await platform.handleAvailability(value);
    handleHint.value = result.available ? '✓ 可用' : result.reason === 'taken' ? '该用户 ID 已被占用' : result.reason === 'reserved' ? '该用户 ID 为系统保留' : '格式不正确';
  } catch { /* 查询失败不阻塞提交 */ }
}
// 勾选“设置密码”时自动发起验证器注册（密码 ⇔ 2FA 不变量）。
watch(wantPassword, async want => {
  if (!want || totp.value || totpLoading.value) return;
  totpLoading.value = true; error.value = '';
  try { const result = await platform.totpEnroll(); totp.value = { id: result.id, secret: result.secret, otpauthUrl: result.otpauthUrl }; }
  catch (e) { error.value = e instanceof Error ? e.message : '生成验证器密钥失败'; }
  finally { totpLoading.value = false; }
});
async function submitComplete() {
  busy.value = true; error.value = '';
  try {
    await platform.registerComplete(wantPassword.value
      ? { name: name.value, handle: handle.value, password: password.value, totpId: totp.value!.id, totpCode: totpCode.value }
      : { name: name.value, handle: handle.value });
    void router.replace('/account');
  } catch (e) { error.value = e instanceof Error ? e.message : '完成注册失败，请重试。'; }
  finally { busy.value = false; }
}
async function copySecret() { if (!totp.value) return; try { await navigator.clipboard.writeText(totp.value.secret); } catch { /* 可手动复制 */ } }

onMounted(async () => {
  const existing = await platform.session();
  checking.value = false;
  if (existing && !existing.setupRequired) { void router.replace('/account'); return; }
  if (existing) { setupSession.value = existing; name.value = existing.name ?? ''; }
});
watchEffect(() => { applyPageSeo({ title: '创建账户 · NexaCL', description: '创建 NexaCL 账户：先用 GitHub / Google / Microsoft 验证身份，再设置用户名、用户 ID 与密码。', path: '/register' }); });
</script>
<style scoped>
.login-page{min-height:100vh;display:flex;flex-direction:column}
.login-topbar{height:60px;display:flex;align-items:center;padding:0 24px}
.login-brand strong{font-size:19px;letter-spacing:-.2px;color:var(--market-text)}
.login-hero{flex:1;display:grid;place-items:center;padding:8px 20px 28px;align-content:center}
.login-footer{display:flex;gap:20px;justify-content:center;margin-top:26px;font-size:12px}
.login-footer a{color:var(--market-muted)}.login-footer a:hover{color:var(--nc-accent)}
.card-eyebrow{text-align:center;margin:14px 0 4px}
.login-card h2{margin:0 0 6px}
.login-sub{min-height:18px}
.credential-form{display:grid;gap:12px;margin-top:18px;text-align:left}.credential-form label{display:grid;gap:8px;font-size:12px;color:#708693}.credential-form input{padding:10px 12px;border:1px solid #dce7ed;border-radius:6px;color:#355260;background:#fff;width:100%}.credential-form .primary-button{width:100%;margin-top:2px}.credential-form .login-fine{margin:2px 0 0;text-align:center}
.form-switch{font-size:12px;color:var(--market-muted);text-align:center;margin:14px 0 0}.form-switch a{color:var(--nc-accent);font-weight:600}
.seg-label{display:block;text-align:center;font-size:12px;color:#708693;margin:6px 0 10px}
.secret-box{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--market-surface-soft);border:1px solid var(--market-border);border-radius:10px;padding:12px 14px;margin:0}
.secret-box code{font-size:14px;letter-spacing:.12em;font-weight:650;color:var(--nc-accent);overflow-wrap:anywhere}
.break-all{overflow-wrap:anywhere;font-size:11px}
@media(max-width:480px){.login-topbar{padding:0 16px}.login-hero{padding:8px 12px 20px}.secret-box{flex-direction:column;align-items:flex-start}}
</style>
