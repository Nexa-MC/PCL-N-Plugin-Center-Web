<template>
  <section class="work-panel device-authorization">
    <p class="eyebrow">NEXACL ID</p><h1>{{ $ui('确认设备登录') }}</h1>
    <p>{{ $ui('仅确认你刚刚在 NexaCL 中发起的登录，并核对客户端显示的设备码。') }}</p>
    <p v-if="loading" role="status">{{ $ui('正在检查会话…') }}</p>
    <template v-else-if="!done">
      <label>{{ $ui('设备码') }}<input v-model="userCode" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH" /></label>
      <p v-if="session">{{ $ui('将使用此账户登录客户端：') }}<strong>{{ session.name }}</strong></p>
      <router-link v-if="!session" class="primary-button" :to="loginTarget">{{ $ui('登录并继续') }}</router-link>
      <div v-else class="actions"><button class="primary-button" :disabled="busy || !valid" @click="confirm('approve')">{{ $ui('确认登录 NexaCL') }}</button><button class="secondary-button" :disabled="busy || !valid" @click="confirm('deny')">{{ $ui('拒绝') }}</button></div>
    </template>
    <p v-else role="status">{{ $ui(done) }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { platform, type Session } from '@/api/platform';
const route = useRoute(), userCode = ref(typeof route.query.user_code === 'string' ? route.query.user_code.slice(0, 9) : '');
const session = ref<Session>(), loading = ref(true), busy = ref(false), done = ref(''), error = ref('');
const valid = computed(() => /^[A-Z2-9]{8}$/.test(userCode.value.toUpperCase().replace(/[- ]/g, '')));
const loginTarget = computed(() => ({ path: '/login', query: { return: '/device?user_code=' + encodeURIComponent(userCode.value) } }));
onMounted(async () => { try { session.value = await platform.session(); } catch { error.value = '无法读取登录状态，请刷新重试。'; } finally { loading.value = false; } });
async function confirm(decision: 'approve' | 'deny') {
  if (busy.value || !valid.value) return;
  busy.value = true; error.value = '';
  try { await platform.confirmDevice(userCode.value, decision); done.value = decision === 'approve' ? '已授权，请返回 NexaCL 完成登录。' : '已拒绝此次设备登录。'; }
  catch (e) { error.value = e instanceof Error ? e.message : '设备码无效或已过期，请在客户端重新发起登录。'; }
  finally { busy.value = false; }
}
</script>
<style scoped>
.device-authorization{max-width:560px;margin:48px auto;padding:32px}.device-authorization label{display:grid;gap:10px;margin:24px 0}.device-authorization input{font-size:24px;letter-spacing:.18em;text-transform:uppercase;padding:12px}.device-authorization .actions{margin-top:24px}
</style>
