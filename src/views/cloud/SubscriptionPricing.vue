<template>
  <LegacyPricing v-if="legacy" />
  <section v-else class="pricing-page subscription-plans">
    <div class="section-heading"><div><p class="eyebrow">CLOUD+</p><h1>{{ copy.title }}</h1><p class="pricing-note">{{ copy.description }}</p></div>
      <div class="billing-toggle" role="group" :aria-label="copy.cycle"><button :class="{ active: cycle === 'month' }" :aria-pressed="cycle === 'month'" @click="cycle = 'month'">{{ copy.month }}</button><button :class="{ active: cycle === 'year' }" :aria-pressed="cycle === 'year'" @click="cycle = 'year'">{{ copy.year }}</button></div>
    </div>
    <div class="regional-toolbar"><label>{{ copy.currency }}<select :value="currency" @change="chooseCurrency"><option v-for="item in currencies" :key="item" :value="item">{{ currencyName(item) }}</option></select></label><span class="status-pill">{{ copy.closed }}</span><span v-if="!supported" class="status-pill">{{ copy.reference }}</span></div>
    <p class="pricing-note">{{ copy.tax }}</p><p v-if="!supported" class="pricing-note" role="status">{{ copy.unsupported }}</p>
    <div class="current-plan work-panel" aria-live="polite"><span>{{ copy.current }}</span><strong>{{ currentText }}</strong><button v-if="session && !loading" class="text-link" @click="loadMembership">{{ copy.refresh }}</button><router-link v-if="!session && !loading" class="text-link" to="/account">{{ copy.login }}</router-link></div>
    <div class="pricing-grid"><article v-for="(plan, index) in plans" :key="plan.name" class="work-panel pricing-card" :class="{ highlight: plan.highlight, selected: action(index) === 'current' }">
      <span v-if="action(index) === 'current'" class="status-pill">{{ copy.actions.current }}</span><span v-else-if="plan.highlight" class="status-pill">{{ $ui('推荐') }}</span>
      <h2>{{ plan.name }}</h2><p class="tier-desc">{{ $ui(plan.description) }}</p><p class="tier-price"><strong>{{ amount(plan.name) }}</strong><small> / {{ cycle === 'month' ? copy.monthUnit : copy.yearUnit }}</small></p>
      <p class="pricing-note">{{ cycle === 'year' ? copy.annual : copy.monthly }} · {{ currency }}</p><ul class="tier-features"><li v-for="feature in plan.features" :key="feature">{{ $ui(feature) }}</li></ul>
      <button class="primary-button" disabled :title="copy.closed">{{ copy.actions[action(index)] }}</button>
    </article></div>
    <div class="work-panel subscription-help"><p>{{ copy.trial }}</p><div class="actions"><router-link class="secondary-button" to="/account?section=wallet">{{ copy.manage }}</router-link><router-link class="secondary-button" to="/legal/refunds">{{ copy.refunds }}</router-link></div></div>
  </section>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { platform, SESSION_EVENT, type Session } from '@/api/platform';
import { PUBLIC_PLANS } from '@/config/publicPricing';
import { REGIONAL_CURRENCIES, SUPPORTED_SUBSCRIPTION_CURRENCIES, regionalAmount, regionalCurrencyFor, type RegionalCurrency } from '@/config/regionalPricing';
import type { BillingCycle, Tier } from '@/config/pricing';
import { confirmedPlan, planAction, type CurrentPlan } from '@/utils/subscriptionPlan';
import { uiLocale } from '@/languages/localize';
// Preserve the existing Paddle implementation as an explicit provider option.
const legacy = import.meta.env.VITE_BILLING_PROVIDER === 'paddle';
const LegacyPricing = defineAsyncComponent(() => import('./Pricing.vue'));
const plans = PUBLIC_PLANS, currencies = REGIONAL_CURRENCIES;
const currency = ref<RegionalCurrency>('USD'), cycle = ref<BillingCycle>('month');
const session = ref<Session>(), current = ref<CurrentPlan | null>(null), loading = ref(true), unavailable = ref(false);
const supported = computed(() => SUPPORTED_SUBSCRIPTION_CURRENCIES.has(currency.value));
const copy = computed(() => uiLocale.value.startsWith('en') ? {
  title: 'Choose your Cloud+ plan', description: 'Custom regional prices for flexible monthly and annual plans.', cycle: 'Billing period', month: 'Monthly', year: 'Annual', monthUnit: 'month', yearUnit: 'year', currency: 'Region / currency', closed: 'Purchases and plan changes are not open yet', reference: 'Reference price',
  tax: 'Amounts use our configured regional price list, not live exchange rates. Final tax treatment will be confirmed when checkout opens. Unlisted currencies use the USD reference price.', unsupported: 'This currency is shown for reference. The current payment channel does not support subscription checkout in this currency.',
  current: 'Current plan', loading: 'Checking…', unknown: 'Temporarily unavailable', login: 'Sign in to check your plan', refresh: 'Refresh', free: 'Free membership', annual: 'Billed annually at ten months of the monthly price', monthly: 'Billed monthly',
  trial: 'The 7-day free trial is available only on Lite, once per account across monthly and annual billing.', manage: 'Manage existing subscription', refunds: 'Refund, trial and subscription policy',
  actions: { subscribe: 'Subscribe', current: 'Current plan', upgrade: 'Upgrade', downgrade: 'Change plan', switch_cycle: 'Change billing period', unknown: 'Subscribe' }
} : {
  title: '选择你的 Cloud+ 套餐', description: '按地区展示自定义价格，灵活选择月付和年付。', cycle: '计费周期', month: '按月', year: '按年', monthUnit: '月', yearUnit: '年', currency: '地区／币种', closed: '购买与套餐变更暂未开放', reference: '参考价',
  tax: '金额来自已配置的地区价格表，不按实时汇率换算。正式税费口径将在结账开放时确认；未配置本币的地区显示美元参考价。', unsupported: '此币种目前仅展示参考价格，当前支付渠道暂不支持该币种的订阅结账。',
  current: '当前套餐', loading: '正在读取…', unknown: '暂时无法读取', login: '登录后查看当前套餐', refresh: '刷新', free: '免费会员', annual: '按年一次计费，年费为月费的十倍', monthly: '每月计费',
  trial: '7 天免费试用仅限 Lite，月付和年付共享每账户一次的试用资格。', manage: '管理已有订阅', refunds: '退款、试用与订阅政策',
  actions: { subscribe: '订阅', current: '当前套餐', upgrade: '升级', downgrade: '调整套餐', switch_cycle: '切换计费周期', unknown: '订阅' }
});
const currentText = computed(() => {
  if (loading.value) return copy.value.loading;
  if (!session.value) return copy.value.login;
  if (unavailable.value || !current.value) return copy.value.unknown;
  if (current.value.rank === 0) return copy.value.free;
  const name = ['Lite', 'Standard', 'Advanced', 'Ultimate'][current.value.rank - 1];
  return `Cloud+ ${name}${current.value.billingCycle ? ' · ' + (current.value.billingCycle === 'month' ? copy.value.month : copy.value.year) : ''}`;
});
const action = (index: number) => planAction(current.value, index + 1, cycle.value);
const amount = (name: Tier['name']) => new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency: currency.value }).format(Number(regionalAmount(name, currency.value, cycle.value)));
const currencyName = (value: RegionalCurrency) => `${value} · ${new Intl.DisplayNames(uiLocale.value, { type: 'currency' }).of(value) || value}`;
let selected = false, generation = 0;
function chooseCurrency(event: Event) { const value = (event.target as HTMLSelectElement).value; if (currencies.includes(value as RegionalCurrency)) { currency.value = value as RegionalCurrency; selected = true; } }
async function loadRegion() {
  try { const r = await fetch('/geo.json', { signal: AbortSignal.timeout(5000) }); if (r.ok) { const data = await r.json(); if (!selected) currency.value = regionalCurrencyFor(data.country); } } catch { /* USD remains explicitly labelled */ }
}
async function loadMembership() {
  const step = ++generation; current.value = null; session.value = undefined; loading.value = true; unavailable.value = false;
  try {
    const user = await platform.session(); if (step !== generation) return; session.value = user;
    if (user) { const result = await platform.entitlements(); if (step !== generation) return; current.value = confirmedPlan(result.membership); unavailable.value = !current.value; }
  } catch { if (step === generation) unavailable.value = true; }
  finally { if (step === generation) loading.value = false; }
}
onMounted(() => { if (!legacy) { window.addEventListener(SESSION_EVENT, loadMembership); void loadRegion(); void loadMembership(); } });
onBeforeUnmount(() => { generation++; window.removeEventListener(SESSION_EVENT, loadMembership); });
</script>
<style scoped>
.regional-toolbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:20px 0}.regional-toolbar label{display:grid;gap:8px;font-size:13px}.regional-toolbar select{font:inherit;padding:10px 12px;min-width:220px;max-width:100%;border:1px solid var(--market-border);border-radius:10px;background:var(--market-surface);color:var(--market-text)}.current-plan{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:24px 0}.current-plan>span{color:var(--market-text-muted);font-size:13px}.selected{outline:2px solid var(--nc-accent)}.subscription-help{margin-top:24px}.subscription-help .actions{flex-wrap:wrap}@media(max-width:500px){.regional-toolbar label{width:100%}.regional-toolbar select{width:100%;min-width:0}.current-plan{gap:10px}}
</style>
