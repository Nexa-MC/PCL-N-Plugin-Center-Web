<template>
  <div class="login-page">
    <!-- 独立登录页:同时是未来启动器设备流 OAuth 的确认页宿主。
         启动器将打开 /login?device=<flow>&user_code=<CODE>,在卡片区域渲染
         “确认设备登录”界面(待启动器侧就绪后实现),登录态与 return 机制已具备。 -->
    <header class="login-topbar">
      <router-link class="login-brand" to="/"><strong>NexaCL</strong></router-link>
    </header>
    <main class="login-hero">
      <p v-if="checking" class="empty-state" role="status">正在检查会话…</p>
      <div v-else class="login-card">
        <span class="login-mark" aria-hidden="true">N</span>
        <p class="eyebrow card-eyebrow">NEXACL ID</p>
        <h2>{{ loginStep === 'creds' ? '登录' : '两步验证' }}</h2>
        <p class="login-sub">{{ loginStep === 'creds' ? '账户 · 订阅 · 下载' : loginUserName }}</p>

        <form v-if="loginStep === 'creds'" class="credential-form" @submit.prevent="submitLogin">
          <label>用户 ID<input v-model.trim="loginHandle" autocomplete="username" minlength="6" maxlength="20" required placeholder="6–20 位，字母开头" /></label>
          <label>密码<input v-model="loginPassword" type="password" autocomplete="current-password" required /></label>
          <p v-if="loginError" class="form-error" role="alert">{{ loginError }}</p>
          <button class="primary-button" type="submit" :disabled="loginBusy">{{ loginBusy ? '正在验证…' : '登录' }}</button>
          <p class="form-switch">没有账户？<router-link to="/register">创建账户</router-link></p>
        </form>

        <form v-else class="credential-form" @submit.prevent="submitMfaCode">
          <template v-if="loginFactors.includes('passkey')">
            <button class="primary-button passkey-primary" type="button" :disabled="loginBusy" @click="passkeyLogin">🔑 {{ loginBusy ? '正在验证…' : '使用 passkey 验证' }}</button>
            <div v-if="hasCodeFactor" class="login-divider" aria-hidden="true"><span>或使用验证码</span></div>
          </template>
          <template v-if="mfaMode === 'app' && loginFactors.includes('totp')">
            <span class="seg-label">验证器应用 · 6 位动态码</span>
            <SegmentedCode v-model="appCode" :length="6" charset="digits" label="验证器动态码" :disabled="loginBusy" @complete="onCodeComplete" />
          </template>
          <template v-else-if="mfaMode === 'recovery' && loginFactors.includes('recovery')">
            <span class="seg-label">恢复码 · 一次性使用</span>
            <SegmentedCode v-model="recoveryInput" :length="10" charset="alnum" :group-size="5" label="恢复码" :disabled="loginBusy" @complete="onCodeComplete" />
          </template>
          <p class="login-fine">优先级：{{ factorLabels }}</p>
          <p v-if="loginError" class="form-error" role="alert">{{ loginError }}</p>
          <button class="primary-button" type="submit" :disabled="loginBusy || !currentCode">{{ loginBusy ? '正在验证…' : '验证并登录' }}</button>
          <div class="mfa-switch">
            <button v-if="mfaMode === 'app' && loginFactors.includes('recovery')" class="back-link" type="button" @click="switchMfaMode('recovery')">改用恢复码</button>
            <button v-if="mfaMode === 'recovery' && loginFactors.includes('totp')" class="back-link" type="button" @click="switchMfaMode('app')">‹ 返回动态码</button>
          </div>
          <button class="back-link" type="button" @click="backToCreds">‹ 返回重输密码</button>
        </form>

        <template v-if="loginStep === 'creds'">
          <div class="login-divider" aria-hidden="true"><span>或使用第三方账户</span></div>
          <label class="accept-check"><input type="checkbox" v-model="tosRead" /><span>我已阅读并接受《<router-link to="/legal/terms">服务条款 v1.0</router-link>》与《<router-link to="/legal/privacy">隐私政策 v1.0</router-link>》</span></label>
          <div class="login-providers">
            <button class="provider-button github" :disabled="busy || !tosRead" @click="oauth('github')"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>GitHub</span></button>
            <button class="provider-button google" :disabled="busy || !tosRead" @click="oauth('google')"><svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Google</span></button>
            <button class="provider-button microsoft" :disabled="busy || !tosRead" @click="oauth('microsoft')"><svg viewBox="0 0 23 23" width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg><span>Microsoft</span></button>
          </div>
        </template>
        <p v-if="oauthError" class="form-error" role="alert">{{ oauthError }}</p>
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
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { platform } from '@/api/platform';
import { assertPasskey } from '@/utils/webauthnClient';
import SegmentedCode from '@/components/SegmentedCode.vue';
import { applyPageSeo } from '@/utils/seo';

const route = useRoute(), router = useRouter();
const checking = ref(true), busy = ref(false), tosRead = ref(false);
const oauthError = computed(() => { const value = route.query.oauth_error; return typeof value === 'string' && value ? value : ''; });
// 登录成功后的回跳目标：仅接受站内相对路径，防开放重定向。
const returnTo = computed(() => { const value = route.query.return; return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/account'; });
function oauth(provider: 'github' | 'microsoft' | 'google') { busy.value = true; platform.oauthStart(provider, returnTo.value, 'login'); }

// ---- 用户 ID + 密码登录（两段式：密码 → 2FA，优先级 Passkey › 验证器 › 恢复码） ----
const loginStep = ref<'creds' | 'mfa'>('creds');
const loginHandle = ref(''), loginPassword = ref(''), loginError = ref(''), loginBusy = ref(false);
const loginChallenge = ref(''), loginFactors = ref<string[]>([]), loginUserName = ref('');
const mfaMode = ref<'app' | 'recovery'>('app');
const appCode = ref(''), recoveryInput = ref('');
const currentCode = computed(() => mfaMode.value === 'app' ? appCode.value : recoveryInput.value);
const hasCodeFactor = computed(() => loginFactors.value.includes('totp') || loginFactors.value.includes('recovery'));
const FACTOR_NAMES: Record<string, string> = { passkey: 'Passkey', totp: '验证器动态码', recovery: '恢复码' };
const FACTOR_ORDER = ['passkey', 'totp', 'recovery'];
const factorLabels = computed(() => [...loginFactors.value].sort((a, b) => FACTOR_ORDER.indexOf(a) - FACTOR_ORDER.indexOf(b)).map(f => FACTOR_NAMES[f] ?? f).join(' › ') || '—');
async function submitLogin() {
  loginBusy.value = true; loginError.value = '';
  try {
    const result = await platform.loginWithPassword(loginHandle.value, loginPassword.value);
    loginChallenge.value = result.challenge; loginFactors.value = result.factors; loginUserName.value = result.user?.name || loginHandle.value;
    mfaMode.value = result.factors.includes('totp') ? 'app' : 'recovery';
    loginPassword.value = ''; appCode.value = ''; recoveryInput.value = ''; loginStep.value = 'mfa';
  } catch (e) { loginError.value = e instanceof Error ? e.message : '登录失败，请稍后重试。'; }
  finally { loginBusy.value = false; }
}
async function submitMfaCode() {
  if (!currentCode.value) return;
  loginBusy.value = true; loginError.value = '';
  try { await platform.loginWithCode(loginChallenge.value, currentCode.value); void router.replace(returnTo.value); }
  catch (e) {
    loginError.value = e instanceof Error ? e.message : '验证失败，请重试。';
    if (mfaMode.value === 'app') appCode.value = ''; else recoveryInput.value = '';
  }
  finally { loginBusy.value = false; }
}
function onCodeComplete() { if (!loginBusy.value) void submitMfaCode(); }
function switchMfaMode(mode: 'app' | 'recovery') { mfaMode.value = mode; loginError.value = ''; appCode.value = ''; recoveryInput.value = ''; }
async function passkeyLogin() {
  loginBusy.value = true; loginError.value = '';
  try {
    const options = await platform.loginPasskeyOptions(loginChallenge.value);
    const assertion = await assertPasskey(options);
    await platform.loginPasskey({ challenge: loginChallenge.value, ...assertion });
    void router.replace(returnTo.value);
  } catch (e) { loginError.value = e instanceof Error ? e.message : 'passkey 校验失败'; }
  finally { loginBusy.value = false; }
}
function backToCreds() { loginStep.value = 'creds'; loginError.value = ''; appCode.value = ''; recoveryInput.value = ''; }

onMounted(async () => {
  // 已登录（含前端测试账户）则直接回跳，不重复展示登录卡。
  if (await platform.session()) { void router.replace(returnTo.value); return; }
  checking.value = false;
});
watchEffect(() => { applyPageSeo({ title: '登录 · NexaCL', description: '登录 NexaCL：用户 ID + 密码（强制两步验证），或 GitHub / Google / Microsoft。', path: '/login' }); });
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
.login-divider{display:flex;align-items:center;gap:12px;margin:22px 0 2px;color:#9aa6b8;font-size:11px}.login-divider:before,.login-divider:after{content:'';flex:1;height:1px;background:#e5ecef}
.credential-form{display:grid;gap:12px;margin-top:18px;text-align:left}.credential-form label{display:grid;gap:8px;font-size:12px;color:#708693}.credential-form input{padding:10px 12px;border:1px solid #dce7ed;border-radius:6px;color:#355260;background:#fff;width:100%}.credential-form .primary-button{width:100%;margin-top:2px}.credential-form .login-fine{margin:2px 0 0;text-align:center}
.form-switch{font-size:12px;color:var(--market-muted);text-align:center;margin:2px 0 0}.form-switch a{color:var(--nc-accent);font-weight:600}
.mfa-title{font-size:14px;font-weight:650;color:var(--market-text);text-align:center}
.back-link{background:transparent;border:0;color:var(--market-muted);font-size:12px;padding:6px;text-align:center;cursor:pointer}.back-link:hover{color:var(--nc-accent)}
.seg-label{display:block;text-align:center;font-size:12px;color:#708693;margin:6px 0 10px}
.passkey-primary{width:100%;min-height:46px;font-size:14px;margin-top:6px}
.mfa-switch{display:flex;justify-content:center;margin-top:-2px}
@media(max-width:480px){.login-topbar{padding:0 16px}.login-hero{padding:8px 12px 20px}}
</style>
