<template>
  <section class="pricing-page public-plans">
    <div class="section-heading"><div><p class="eyebrow">CLOUD+</p><h1>{{ $ui('套餐价格') }}</h1><p class="pricing-note">{{ $ui('无需登录即可查看已确认的美元参考标价。') }}</p></div>
      <div class="billing-toggle" role="group" :aria-label="$ui('计费周期')"><button type="button" :class="{ active: cycle === 'month' }" :aria-pressed="cycle === 'month'" @click="cycle = 'month'">{{ $ui('按月') }}</button><button type="button" :class="{ active: cycle === 'year' }" :aria-pressed="cycle === 'year'" @click="cycle = 'year'">{{ $ui('按年') }}</button></div>
    </div>
    <div class="public-price-status"><span class="status-pill">USD</span><span class="status-pill">{{ $ui('税费配置待核验') }}</span><span class="status-pill">{{ $ui('购买暂未开放') }}</span></div>
    <p class="pricing-note">{{ $ui('现有政策原则上采用含税展示；正式税费与地区价格配置尚未核验，当前标价供参考，最终应付金额须在结账开放后确认。') }}</p>
    <div class="pricing-grid"><article v-for="plan in PUBLIC_PLANS" :key="plan.name" class="work-panel pricing-card" :class="{ highlight: plan.highlight }">
      <span v-if="plan.highlight" class="status-pill">{{ $ui('推荐') }}</span><h2>{{ plan.name }}</h2><p class="tier-desc">{{ $ui(plan.description) }}</p>
      <p class="tier-price"><strong>{{ amount(plan.amount[cycle]) }}</strong><small> / {{ $ui(cycle === 'month' ? '月' : '年') }}</small></p>
      <p class="pricing-note">{{ $ui(cycle === 'month' ? '每月计费' : '按年一次计费') }} · USD</p>
      <ul class="tier-features"><li v-for="feature in plan.features" :key="feature">{{ $ui(feature) }}</li></ul>
      <button class="primary-button" disabled>{{ $ui('购买暂未开放') }}</button>
    </article></div>
    <section class="work-panel public-price-links"><h2>{{ $ui('购买前了解规则') }}</h2><p>{{ $ui('Lite 提供每账户一次的7天免费试用，具体资格与首次收费信息以开放后的结账页面为准。') }}</p><div class="actions"><router-link class="secondary-button" to="/legal/refunds">{{ $ui('退款、试用与订阅政策') }}</router-link><router-link class="secondary-button" to="/account?section=wallet">{{ $ui('管理已有订阅') }}</router-link></div></section>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { uiLocale } from '@/languages/localize';
import { PUBLIC_PLANS } from '@/config/publicPricing';
import type { BillingCycle } from '@/config/pricing';
const cycle = ref<BillingCycle>('month');
const amount = (minor: string) => new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency: 'USD' }).format(Number(minor) / 100);
</script>
<style scoped>
.public-price-status{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.public-price-links{margin-top:24px}.public-price-links .actions{flex-wrap:wrap}.public-plans .tier-price strong{overflow-wrap:anywhere}
</style>
