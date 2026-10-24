<template>
  <section class="checkout-result pricing-page">
    <p class="eyebrow">CLOUD+ · TEST</p><h1>{{ copy.title }}</h1><p class="pricing-note">{{ copy.note }}</p>
    <div class="work-panel result-panel" aria-live="polite">
      <p v-if="state === 'invalid'" role="alert">{{ copy.invalid }}</p>
      <p v-else-if="state === 'login'">{{ copy.login }}</p>
      <p v-else-if="state === 'forbidden'" role="alert">{{ copy.forbidden }}</p>
      <p v-else-if="state === 'missing'" role="alert">{{ copy.missing }}</p>
      <p v-else-if="state === 'unavailable'">{{ copy.pending }}</p>
      <p v-else-if="state === 'loading' && !orders.length">{{ copy.loading }}</p>
      <p v-else-if="state === 'ready' && !orders.length">{{ copy.empty }}</p>
      <p v-if="state === 'unavailable'" class="pricing-note" role="alert">{{ copy.unavailable }}</p>
      <article v-for="order in orders" :key="order.intentId" class="result-order">
        <div><h2>{{ offerName(order.offerId) }}</h2><span class="status-pill" :class="{ confirmed: order.status === 'confirmed' }">{{ copy.status[order.status] }}</span></div>
        <p>{{ amount(order) }} · {{ copy.reference }}</p>
        <p v-if="order.status === 'pending'">{{ copy.pending }}</p>
        <p v-else-if="order.status === 'confirmed'">{{ copy.confirmed }}</p>
        <p v-else>{{ copy.inactive }}</p>
      </article>
      <button v-if="state !== 'invalid'" class="secondary-button" type="button" :disabled="busy" @click="reload">{{ busy ? copy.loading : copy.refresh }}</button>
    </div>
    <div class="actions result-actions"><router-link class="primary-button" to="/plans">{{ copy.plans }}</router-link><router-link class="secondary-button" to="/account?section=wallet">{{ copy.account }}</router-link></div>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { request, ApiError, SESSION_EVENT } from '@/api/platform';
import { uiLocale } from '@/languages/localize';
import { parseTestReturn, testOrderResults, type TestOrderResult } from '@/utils/checkoutResult';
const route = useRoute(), orders = ref<TestOrderResult[]>([]), busy = ref(false);
const state = ref<'loading' | 'ready' | 'invalid' | 'login' | 'forbidden' | 'missing' | 'unavailable'>('loading');
const copy = computed(() => uiLocale.value.startsWith('en') ? {
  title: 'Test checkout result', note: 'Only your own test orders appear here. This page does not confirm a live payment.',
  invalid: 'This return link does not identify a supported test checkout.', login: 'Sign in to your Nexa account to view your own test orders.',
  forbidden: 'Test checkout is currently available only to site administrators.', missing: 'This order does not exist or is not available to this account.',
  unavailable: 'Order confirmation is temporarily unavailable. This does not mean payment succeeded. Please try again later.', loading: 'Checking…',
  empty: 'No test orders are linked to this account.', refresh: 'Check again', plans: 'View plans', account: 'Account and subscriptions',
  reference: 'Order reference price', pending: 'Thank you for subscribing. We are verifying your bill. This may take a few minutes.',
  confirmed: 'Test access has been confirmed by the server. It grants no live service access.', inactive: 'This test order currently grants no active access.',
  status: { pending: 'Awaiting confirmation', confirmed: 'Test access confirmed', inactive: 'Inactive', review: 'Under review', revoked: 'Revoked' }
} : {
  title: '测试结账结果', note: '这里只显示本人的测试订单，不代表真实扣款。', invalid: '此返回链接未标明受支持的测试结账。',
  login: '请登录 Nexa 账户后查看本人的测试订单。', forbidden: '当前测试结账仅向网站管理员开放。', missing: '订单不存在或当前账户无权查看。',
  unavailable: '暂时无法确认订单，这不代表支付成功。请稍后重试。', loading: '正在核对…', empty: '当前账户没有已关联的测试订单。',
  refresh: '重新核对', plans: '查看套餐', account: '账户与订阅', reference: '订单参考标价',
  pending: '感谢您的订阅，我们正在核验您的账单，这可能需要几分钟。', confirmed: '服务端已确认测试权益，不会授予正式服务权益。',
  inactive: '此测试订单当前没有有效权益。', status: { pending: '等待确认', confirmed: '测试权益已确认', inactive: '已失效', review: '待复核', revoked: '已撤销' }
});
function offerName(id: string) {
  const parts = id.split(':');
  if (parts[0] !== 'cloud-plus') return uiLocale.value.startsWith('en') ? 'Software order' : '软件订单';
  const plan: Record<string, string> = { lite: 'Lite', standard: 'Standard', advanced: 'Advanced', ultimate: 'Ultimate' };
  const cycle = uiLocale.value.startsWith('en') ? (parts[2] === 'year' ? 'Annual' : 'Monthly') : (parts[2] === 'year' ? '年付' : '月付');
  return `Cloud+ ${plan[parts[1]] || ''} · ${cycle}`;
}
const amount = (order: TestOrderResult) => new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency: order.currency }).format(Number(order.amountMinor) / 100);
let generation = 0, attempts = 0, timer: ReturnType<typeof setTimeout> | undefined;
const stop = () => { if (timer) clearTimeout(timer); timer = undefined; };
async function load() {
  stop(); const current = ++generation, parsed = parseTestReturn(window.location.search);
  if (!parsed.valid) { orders.value = []; state.value = 'invalid'; busy.value = false; return; }
  busy.value = true; state.value = 'loading';
  try {
    const suffix = parsed.intentId ? '/' + encodeURIComponent(parsed.intentId) : '';
    const result = testOrderResults(await request<unknown>('/billing/test/orders' + suffix));
    if (generation !== current) return;
    orders.value = result.orders; state.value = 'ready';
    if (result.orders.some(order => order.status === 'pending') && ++attempts < 10) timer = setTimeout(load, 3000);
  } catch (error) {
    if (generation !== current) return;
    orders.value = [];
    state.value = error instanceof ApiError && error.status === 401 ? 'login' : error instanceof ApiError && error.status === 403 ? 'forbidden'
      : error instanceof ApiError && error.status === 404 && error.message === 'waffo_test_order_not_found' ? 'missing' : 'unavailable';
  } finally { if (generation === current) busy.value = false; }
}
function reload() { attempts = 0; orders.value = []; void load(); }
onMounted(() => { window.addEventListener(SESSION_EVENT, reload); void load(); });
watch(() => route.fullPath, reload);
onBeforeUnmount(() => { generation++; stop(); window.removeEventListener(SESSION_EVENT, reload); });
</script>
<style scoped>
.checkout-result{max-width:900px;margin:auto}.result-panel{margin:24px 0}.result-order{padding:16px 0;border-bottom:1px solid var(--market-border);margin-bottom:18px}.result-order>div{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.result-order h2{margin:0;font-size:18px}.result-order p{color:var(--market-text-muted);line-height:1.7}.result-actions{flex-wrap:wrap}.confirmed{font-weight:600}
</style>
