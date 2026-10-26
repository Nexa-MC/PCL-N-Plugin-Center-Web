<template>
  <LegacyPricing v-if="legacy" />
  <section v-else class="pricing-page subscription-plans">
    <div class="section-heading"><div><p class="eyebrow">CLOUD+</p><h1>{{ copy.title }}</h1><p class="pricing-note">{{ copy.description }}</p></div>
      <div class="billing-toggle" role="group" :aria-label="copy.cycle"><button :class="{ active: cycle === 'month' }" :aria-pressed="cycle === 'month'" @click="cycle = 'month'">{{ copy.month }}</button><button :class="{ active: cycle === 'year' }" :aria-pressed="cycle === 'year'" @click="cycle = 'year'">{{ copy.year }}</button></div>
    </div>
    <p v-if="presentment !== currency" class="pricing-note" role="note">{{ uiLocale.startsWith('en') ? `Pay in ${presentment} when your billing country supports it. The prices below are in ${currency}; Waffo shows the converted total before payment, including its 2–4% conversion fee.` : `可按账单国家使用 ${presentment} 支付。下方为 ${currency} 定价，Waffo 会在付款前显示换算后的总额，其中包含 2–4% 的换汇费用。` }}</p>
    <p v-if="loading" class="pricing-note" role="status">{{ copy.loading }}</p>
    <p v-else-if="unavailable" class="pricing-note" role="status">{{ copy.unavailable }}</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div id="subscription-plans" class="pricing-grid"><article v-for="plan in visiblePlans" :key="plan.name" class="work-panel pricing-card" :class="{ highlight: plan.highlight }">
      <span v-if="plan.highlight" class="status-pill">{{ $ui('推荐') }}</span>
      <h2>{{ plan.name }}</h2><p class="tier-desc">{{ $ui(plan.description) }}</p><p class="tier-price"><strong>{{ amount(plan.name) }}</strong><small> / {{ cycle === 'month' ? copy.monthUnit : copy.yearUnit }}</small></p>
      <p class="pricing-note">{{ cycle === 'year' ? copy.annual : copy.monthly }} · {{ currency }}</p><ul class="tier-features"><li v-for="feature in plan.features" :key="feature">{{ $ui(feature) }}</li></ul>
      <button class="primary-button" :disabled="disabled" @click="subscribe(plan.name)">{{ busy === plan.name ? copy.opening : label(plan.name) }}</button>
    </article></div>
    <p v-if="hasLowerPlans" class="more-plans"><a href="#subscription-plans" :aria-expanded="expanded" aria-controls="subscription-plans" @click.prevent="expanded = !expanded">{{ expanded ? copy.less : copy.more }}</a></p>
    <p class="login-fine"><button v-if="readiness?.portalEnabled" class="text-link" :disabled="Boolean(busy)" @click="manage">{{ copy.actions.current }}</button> {{ copy.payment }} <router-link class="text-link" to="/legal/refunds">{{ copy.refunds }}</router-link></p>
  </section>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { platform, request, isTestSession, SESSION_EVENT, type Session } from '@/api/platform';
import { PUBLIC_PLANS } from '@/config/publicPricing';
import { browserRegionalPricing, browserPresentmentCurrency, regionalAmount } from '@/config/regionalPricing';
import type { BillingCycle, Tier } from '@/config/pricing';
import { confirmedPlan, planAction, visiblePlanRanks, hasLegacyPaddleSubscription, type CurrentPlan } from '@/utils/subscriptionPlan';
import { waffoReadiness, waffoRedirect, type WaffoReadiness } from '@/utils/waffoCheckout';
import { uiLocale } from '@/languages/localize';
const legacy = import.meta.env.VITE_BILLING_PROVIDER === 'paddle';
const LegacyPricing = defineAsyncComponent(() => import('./Pricing.vue'));
const router = useRouter(), plans = PUBLIC_PLANS;
const currency = browserRegionalPricing(navigator.languages?.length ? navigator.languages : [navigator.language]).currency, cycle = ref<BillingCycle>('month');
const presentment = browserPresentmentCurrency(navigator.languages?.length ? navigator.languages : [navigator.language]);
const session = ref<Session>(), current = ref<CurrentPlan | null>(null), loading = ref(true), unavailable = ref(false), expanded = ref(false);
const readiness = ref<WaffoReadiness>(), busy = ref(''), error = ref('');
const paddleSubscription = ref(false);
const ranks = computed(() => visiblePlanRanks(current.value, expanded.value));
const rank = (name: Tier['name']) => plans.findIndex(plan => plan.name === name) + 1;
const visiblePlans = computed(() => plans.filter(plan => ranks.value.includes(rank(plan.name))));
const hasLowerPlans = computed(() => Boolean(current.value && current.value.rank > 1));
const disabled = computed(() => loading.value || Boolean(busy.value) || Boolean(session.value && (!current.value || isTestSession() || (current.value.rank > 0 ? !paddleSubscription.value && !readiness.value?.portalEnabled : !readiness.value?.checkoutEnabled || !readiness.value.currencies.includes(currency)))));
const copy = computed(() => uiLocale.value.startsWith('en') ? {
  title: 'Choose your Cloud+ plan', description: 'Flexible monthly and annual plans.', cycle: 'Billing period', month: 'Monthly', year: 'Annual', monthUnit: 'month', yearUnit: 'year',
  loading: 'Checking subscription…', unavailable: 'Payment is temporarily unavailable. Please try again later.', annual: 'Billed annually at ten months of the monthly price', monthly: 'Billed monthly',
  payment: 'Payments are processed by Waffo Pancake.', refunds: 'Refund, trial and subscription policy', more: 'More plans', less: 'Fewer plans', opening: 'Opening checkout…', failed: 'Unable to open payment. Please try again.',
  actions: { subscribe: 'Subscribe', current: 'Manage subscription', upgrade: 'Upgrade', downgrade: 'Change plan', switch_cycle: 'Change billing period', unknown: 'Subscribe' }
} : {
  title: '选择你的 Cloud+ 套餐', description: '灵活选择月付和年付。', cycle: '计费周期', month: '按月', year: '按年', monthUnit: '月', yearUnit: '年',
  loading: '正在读取订阅…', unavailable: '支付暂不可用，请稍后重试。', annual: '按年一次计费，年费为月费的十倍', monthly: '每月计费',
  payment: '付款由 Waffo Pancake 处理。', refunds: '退款、试用与订阅政策', more: '更多套餐', less: '收起套餐', opening: '正在打开结账…', failed: '暂时无法打开支付，请重试。',
  actions: { subscribe: '订阅', current: '管理订阅', upgrade: '升级', downgrade: '调整套餐', switch_cycle: '切换计费周期', unknown: '订阅' }
});
const label = (name: Tier['name']) => copy.value.actions[planAction(current.value, rank(name), cycle.value)];
const amount = (name: Tier['name']) => new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency }).format(Number(regionalAmount(name, currency, cycle.value)));
const keys = new Map<string, string>();
let generation = 0;
async function loadMembership() {
  const step = ++generation; current.value = null; session.value = undefined; readiness.value = undefined; paddleSubscription.value = false; loading.value = true; unavailable.value = false; expanded.value = false; error.value = ''; keys.clear();
  try {
    const user = await platform.session(); if (step !== generation) return; session.value = user;
    if (user) {
      const [membership, availability] = await Promise.all([platform.entitlements(), request<unknown>('/billing/waffo/status').then(waffoReadiness).catch(() => undefined)]);
      if (step !== generation) return; current.value = confirmedPlan(membership.membership); readiness.value = availability;
      paddleSubscription.value = hasLegacyPaddleSubscription(membership);
      unavailable.value = !current.value || !availability?.checkoutEnabled;
    }
  } catch { if (step === generation) unavailable.value = true; }
  finally { if (step === generation) loading.value = false; }
}
async function subscribe(name: Tier['name']) {
  if (disabled.value) return;
  if (!session.value) { await router.push({ path: '/login', query: { return: '/pricing' } }); return; }
  if (current.value && current.value.rank > 0) { await manage(); return; }
  const userId = session.value.id, step = generation; busy.value = name; error.value = '';
  try {
    if (isTestSession()) throw new Error(copy.value.unavailable);
    const offerId = `cloud-plus:${name.toLowerCase()}:${cycle.value}`, offerKey = `${offerId}:${currency}`;
    const key = keys.get(offerKey) || crypto.randomUUID(); keys.set(offerKey, key);
    const target = waffoRedirect(await request('/billing/waffo/checkout', { method: 'POST', body: JSON.stringify({ offerId, currency }), headers: { 'Idempotency-Key': key } }), 'checkout');
    const user = await platform.refreshSession();
    if (step !== generation || user?.id !== userId) throw new Error(copy.value.unavailable);
    window.location.assign(target);
  } catch { if (step === generation) error.value = copy.value.failed; }
  finally { busy.value = ''; }
}
async function manage() {
  if (busy.value || !session.value || isTestSession()) return;
  if (paddleSubscription.value && !readiness.value?.portalEnabled) { await router.push('/account?section=wallet'); return; }
  const userId = session.value.id, step = generation; busy.value = 'portal'; error.value = '';
  try {
    const target = waffoRedirect(await request('/billing/waffo/portal', { method: 'POST', body: '{}' }), 'portal');
    const user = await platform.refreshSession();
    if (step !== generation || user?.id !== userId) throw new Error(copy.value.unavailable);
    window.location.assign(target);
  } catch { if (step === generation) error.value = copy.value.failed; }
  finally { busy.value = ''; }
}
onMounted(() => { if (!legacy) { window.addEventListener(SESSION_EVENT, loadMembership); void loadMembership(); } });
onBeforeUnmount(() => { generation++; window.removeEventListener(SESSION_EVENT, loadMembership); });
</script>
<style scoped>
.pricing-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}.pricing-card{max-width:420px;width:100%;justify-self:center}.more-plans{text-align:center;margin:26px 0}.more-plans a{color:var(--nc-accent);text-decoration:underline;text-underline-offset:4px}.subscription-plans>.login-fine{margin-top:24px}.login-fine button.text-link{background:transparent;border:0;padding:0;color:var(--nc-accent);font:inherit;text-decoration:underline;text-underline-offset:3px}
</style>
