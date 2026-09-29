<template>
  <div class="login-page">
    <header class="login-topbar">
      <router-link class="login-brand" to="/"><strong>NexaCL</strong></router-link>
    </header>
    <main class="login-hero">
      <div class="login-card">
        <span class="login-mark" aria-hidden="true">N</span>
        <p class="eyebrow card-eyebrow">NEXACL ID</p>
        <h2>{{ step === 'form' ? '创建账户' : '绑定验证器' }}</h2>
        <p class="login-sub">{{ step === 'form' ? '用户名 · 用户 ID · 密码' : '最后一步，完成即可登录' }}</p>

        <form v-if="step === 'form'" class="credential-form" @submit.prevent="submitRegister">
          <label>用户名<input v-model.trim="name" maxlength="60" required placeholder="1–60 个字符" /></label>
          <label>用户 ID<input v-model.trim="handle" minlength="6" maxlength="20" required pattern="[A-Za-z][A-Za-z0-9_-]{5,19}" placeholder="6–20 位，字母开头，用于登录" /></label>
          <label>密码<input v-model="password" type="password" minlength="14" maxlength="256" required autocomplete="new-password" placeholder="至少 14 位" /></label>
          <label>确认密码<input v-model="password2" type="password" minlength="14" maxlength="256" required autocomplete="new-password" /></label>
          <label class="accept-check"><input type="checkbox" v-model="tosRead" /><span>我已阅读并接受《<router-link to="/legal/terms">服务条款 v1.0</router-link>》与《<router-link to="/legal/privacy">隐私政策 v1.0</router-link>》</span></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="primary-button" type="submit" :disabled="busy || !canSubmit">{{ busy ? '正在创建…' : '创建账户并继续' }}</button>
          <p class="form-switch">已有账户？<router-link to="/login">直接登录</router-link></p>
        </form>

        <div v-else class="credential-form">
          <p class="secret-box"><code>{{ totp?.secret }}</code><button class="secondary-button" type="button" @click="copySecret">复制</button></p>
          <p class="login-fine break-all">{{ totp?.otpauthUrl }}</p>
          <span class="seg-label">验证器应用显示的 6 位动态码</span>
          <SegmentedCode v-model="code" :length="6" charset="digits" label="注册动态码" :disabled="busy" @complete="onComplete" />
          <p class="login-fine">{{ countdownText }}</p>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="primary-button" type="button" :disabled="busy || code.length !== 6" @click="confirm">{{ busy ? '正在完成…' : '完成注册' }}</button>
          <button class="back-link" type="button" :disabled="busy" @click="restart">‹ 重新填写</button>
        </div>
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
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { platform, POLICY_VERSION } from '@/api/platform';
import SegmentedCode from '@/components/SegmentedCode.vue';
import { applyPageSeo } from '@/utils/seo';

const route = useRoute(), router = useRouter();
const step = ref<'form' | 'totp'>('form');
const name = ref(''), handle = ref(''), password = ref(''), password2 = ref(''), tosRead = ref(false);
const busy = ref(false), error = ref('');
const totp = ref<{ secret: string; otpauthUrl: string } | null>(null);
const challenge = ref(''), code = ref('');
const expiresAt = ref(0);
const remaining = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

const HANDLE_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{5,19}$/;
const canSubmit = computed(() => Boolean(name.value) && HANDLE_PATTERN.test(handle.value) && password.value.length >= 14 && password.value === password2.value && tosRead.value);
const countdownText = computed(() => remaining.value > 0 ? `密钥将在 ${Math.floor(remaining.value / 60)} 分 ${remaining.value % 60} 秒后失效` : '');

async function submitRegister() {
  busy.value = true; error.value = '';
  try {
    if (password.value !== password2.value) { error.value = '两次输入的密码不一致'; return; }
    const result = await platform.registerStart({ name: name.value, handle: handle.value, password: password.value, tos: POLICY_VERSION });
    challenge.value = result.challenge;
    totp.value = { secret: result.totp.secret, otpauthUrl: result.totp.otpauthUrl };
    expiresAt.value = Date.now() + result.expiresIn;
    remaining.value = Math.round(result.expiresIn / 1000);
    step.value = 'totp';
  } catch (e) { error.value = e instanceof Error ? e.message : '注册失败，请重试。'; }
  finally { busy.value = false; }
}
async function confirm() {
  busy.value = true; error.value = '';
  try { await platform.registerConfirm(challenge.value, code.value); void router.replace(typeof route.query.return === 'string' && route.query.return.startsWith('/') && !route.query.return.startsWith('//') ? route.query.return : '/account'); }
  catch (e) { error.value = e instanceof Error ? e.message : '验证失败，请重试。'; code.value = ''; }
  finally { busy.value = false; }
}
function onComplete() { if (!busy.value && code.value.length === 6) void confirm(); }
function restart() { step.value = 'form'; error.value = ''; code.value = ''; totp.value = null; challenge.value = ''; }
async function copySecret() { if (!totp.value) return; try { await navigator.clipboard.writeText(totp.value.secret); } catch { /* 用户可手动复制 */ } }

onMounted(async () => {
  // 已登录直接回跳。
  if (await platform.session()) { void router.replace('/account'); return; }
  timer = setInterval(() => {
    remaining.value = Math.max(0, Math.round((expiresAt.value - Date.now()) / 1000));
    if (expiresAt.value && remaining.value === 0 && step.value === 'totp') { error.value = '注册已超时，请重新填写。'; step.value = 'form'; totp.value = null; }
  }, 1000);
});
onBeforeUnmount(() => { clearInterval(timer); });
watchEffect(() => { applyPageSeo({ title: '注册 · NexaCL', description: '创建 NexaCL 账户：设置用户名、用户 ID 与密码，并绑定验证器应用。', path: '/register' }); });
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
.form-switch{font-size:12px;color:var(--market-muted);text-align:center;margin:2px 0 0}.form-switch a{color:var(--nc-accent);font-weight:600}
.back-link{background:transparent;border:0;color:var(--market-muted);font-size:12px;padding:6px;text-align:center;cursor:pointer}.back-link:hover{color:var(--nc-accent)}
.seg-label{display:block;text-align:center;font-size:12px;color:#708693;margin:6px 0 10px}
.secret-box{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--market-surface-soft);border:1px solid var(--market-border);border-radius:10px;padding:12px 14px;margin:0}
.secret-box code{font-size:14px;letter-spacing:.12em;font-weight:650;color:var(--nc-accent);overflow-wrap:anywhere}
.break-all{overflow-wrap:anywhere;font-size:11px}
@media(max-width:480px){.login-topbar{padding:0 16px}.login-hero{padding:8px 12px 20px}.secret-box{flex-direction:column;align-items:flex-start}}
</style>
