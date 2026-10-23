<template>
  <section class="pricing-page">
    <div class="section-heading"><div><p class="eyebrow">CLOUD+</p><h1>{{ $ui("选择你的 Cloud+ 套餐") }}</h1></div>
      <div class="billing-toggle" role="group" :aria-label="$ui('计费周期')">
        <button type="button" :class="{ active: cycle === 'month' }" @click="cycle = 'month'">{{ $ui("按月") }}</button>
        <button type="button" :class="{ active: cycle === 'year' }" @click="cycle = 'year'">{{ $ui("按年") }}</button>
      </div>
    </div>
    <p v-if="session" class="pricing-note">{{ $ui("当前会员等级：") }}<strong>{{ $ui(membership?.name || membershipError || "正在读取…") }}</strong></p>
    <p class="pricing-note">{{ $ui("价格由 Paddle 实时返回并按你的地区本地化展示。") }}{{ isSandbox ? $ui("当前为沙箱环境，使用测试支付方式，不会产生真实扣款。") : '' }}</p>
    <p v-if="envError" class="form-error" role="alert">{{ $ui(envError) }}</p>
    <template v-else>
      <p v-if="!isSandbox" class="pricing-note" role="status">{{ $ui('正式支付尚未开放，当前仅供核对价格。') }}</p>
      <p v-else-if="sessionReady && !canCheckout" class="form-error" role="alert">{{ $ui("沙箱测试阶段：结账仅对网站管理员开放，普通用户暂时无法结账。") }}</p>
      <p v-if="loading" class="empty-state" role="status">{{ $ui("正在读取实时价格…") }}</p>
      <p v-else-if="error" class="empty-state" role="alert">{{ $ui(error) }}　<button class="secondary-button" @click="loadPrices">{{ $ui("重试") }}</button></p>
      <div v-else class="pricing-grid">
        <article v-for="tier in tiers" :key="tier.name" class="work-panel pricing-card" :class="{ highlight: tier.highlight }">
          <span v-if="tier.highlight" class="status-pill">{{ $ui("推荐") }}</span>
          <h2>{{ tier.name }}</h2>
          <p class="tier-desc">{{ $ui(tier.description) }}</p>
          <p class="tier-price"><template v-if="totals[tier.priceId[cycle]]"><strong>{{ totals[tier.priceId[cycle]] }}</strong><small> / {{ cycle === 'month' ? $ui("月") : $ui("年") }}</small></template><template v-else><strong>—</strong><small> {{ $ui("价格不可用") }}</small></template></p>
          <ul class="tier-features"><li v-for="feature in tier.features" :key="feature">{{ $ui(feature) }}</li></ul>
          <button v-if="tier.priceId[cycle]" class="primary-button" :disabled="busy === tier.name || !canCheckout" :title="canCheckout ? '' : $ui(isSandbox ? '沙箱测试阶段，仅网站管理员可发起结账' : '正式支付尚未开放，当前仅供核对价格。')" @click="subscribe(tier)">{{ busy === tier.name ? $ui("正在打开结账…") : $ui("订阅") }}</button>
          <p v-else class="tier-unconfigured">{{ cycle === 'month' ? $ui("该档位尚未配置月付价格。") : $ui("该档位尚未配置年付价格。") }}</p>
        </article>
      </div>
    </template>
    <p class="login-fine">{{ $ui("订阅交易由 Paddle 作为 Merchant of Record 处理付款与税务；取消、试用与退款适用") }} <router-link to="/legal/refunds">{{ $ui("《Nexa 退款、试用与订阅政策》") }}</router-link>{{ $ui("。") }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { tiersFor, type Tier, type BillingCycle } from '@/config/pricing';
import { platform, type Session, type Membership } from '@/api/platform';
import { uiLocale } from '@/languages/localize';

const cycle = ref<BillingCycle>('month'), loading = ref(true), error = ref(''), busy = ref<Tier['name'] | ''>('');
const totals = ref<Record<string, string>>({});
// Until verification and a separate go-live step, production checkout stays closed.
const session = ref<Session>(), sessionReady = ref(false);
const membership = ref<Membership>(), membershipError = ref('');

// 环境必须显式配置：禁止在未设置环境变量时静默默认，避免连错 Paddle 账户。
const env = import.meta.env.VITE_PADDLE_ENV;
const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const tiers = tiersFor(env, import.meta.env);
const envError = ref('');
if (env !== 'sandbox' && env !== 'production') envError.value = '支付配置暂不可用，请稍后重试。';
else if (!token || !token.startsWith(env === 'sandbox' ? 'test_' : 'live_')) envError.value = '支付配置暂不可用，请稍后重试。';
else if (tiers.some(tier => !tier.priceId.month || !tier.priceId.year)
  || new Set(tiers.flatMap(tier => Object.values(tier.priceId))).size !== 8) envError.value = '套餐价格尚未配置完成。';
const isSandbox = env === 'sandbox';
const canCheckout = computed(() => isSandbox && session.value?.staff === 1);

let paddleCustomerId: string | null = null;
let identityPromise: Promise<void> | undefined;
function loadIdentity() {
  identityPromise ??= (async () => {
    try {
      session.value = await platform.session();
      if (session.value) {
        const result = await platform.entitlements();
        membership.value = result.membership;
        // The authenticated API resolves the actual Paddle customer; never use
        // the Nexa user ID or an email address as a Retain customer ID.
        if (/^ctm_[a-z0-9]{26}$/.test(result.paddleCustomerId || '')) paddleCustomerId = result.paddleCustomerId;
      }
    } catch { membershipError.value = '暂时无法读取'; }
    finally { sessionReady.value = true; }
  })();
  return identityPromise;
}

let paddlePromise: Promise<Paddle | undefined> | undefined;
async function getPaddle() {
  await loadIdentity();
  paddlePromise ??= initializePaddle({
    ...(isSandbox ? { environment: 'sandbox' as const } : {}),
    token,
    ...(paddleCustomerId ? { pwCustomer: { id: paddleCustomerId } } : {})
  });
  return paddlePromise;
}

// 国家来自 Cloudflare 边缘（request.cf.country）。仅在拿到合法两位国家码时传给 Paddle；
// 否则完全不传，由 PricePreview 按访客 IP 自动定位。不向 Paddle 传任何“未知”占位值。
async function detectCountry(): Promise<string | null> {
  try {
    const response = await fetch('/geo.json', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json() as { country: string | null };
    return data.country && /^[A-Z]{2}$/.test(data.country) ? data.country : null;
  } catch { return null; }
}

// 请求序号守卫：快速切换月/年时丢弃过期响应，避免旧结果覆盖新价格。
let generation = 0;
async function loadPrices() {
  if (envError.value) return;
  const current = ++generation;
  loading.value = true; error.value = '';
  try {
    const paddle = await getPaddle();
    if (!paddle) throw new Error('Paddle 初始化失败，请检查客户端令牌。');
    const items = tiers.filter(t => t.priceId[cycle.value]).map(t => ({ priceId: t.priceId[cycle.value], quantity: 1 }));
    if (!items.length) throw new Error('定价配置中尚未填写价格 ID，请在 src/config/pricing.ts 中填入 Paddle 价格。');
    const country = await detectCountry();
    const preview = await paddle.PricePreview(country ? { items, address: { countryCode: country } } : { items });
    if (current !== generation) return;
    const next: Record<string, string> = {};
    for (const line of preview.data.details.lineItems) next[line.price.id] = line.formattedTotals.total;
    totals.value = next;
  } catch (e) {
    if (current !== generation) return;
    error.value = e instanceof Error ? e.message : '暂时无法读取价格，请稍后重试。';
  } finally {
    if (current === generation) loading.value = false;
  }
}
watch(cycle, () => { if (!envError.value) void loadPrices(); });
onMounted(() => { void loadIdentity(); void loadPrices(); });

async function subscribe(tier: Tier) {
  if (!canCheckout.value) return;
  busy.value = tier.name; error.value = '';
  try {
    const paddle = await getPaddle();
    if (!paddle) throw new Error('Paddle 初始化失败，请检查客户端令牌。');
    const priceId = tier.priceId[cycle.value];
    if (!priceId) throw new Error('该档位尚未配置价格。');
    // 已登录用户预填邮箱；未登录则交给结账页自行收集。
    const session = await platform.session();
    if (!isSandbox || session?.staff !== 1) throw new Error('结账暂不可用。');
    await paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(session?.email ? { customer: { email: session.email } } : {}),
      // 服务端履约层据此将 Paddle 客户关联到当前账户（webhook 回传 custom_data）。
      ...(session?.id ? { customData: { userId: session.id } } : {}),
      settings: { displayMode: 'overlay', variant: 'one-page', locale: uiLocale.value === 'zh-CN' ? 'zh-Hans' : 'en', successUrl: `${window.location.origin}/welcome` }
    });
  } catch (e) { error.value = e instanceof Error ? e.message : '无法打开结账，请稍后重试。'; }
  finally { busy.value = ''; }
}
</script>
