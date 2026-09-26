<template>
  <section class="pricing-page">
    <div class="section-heading"><div><p class="eyebrow">CLOUD+</p><h1>选择你的 Cloud+ 套餐</h1></div>
      <div class="billing-toggle" role="group" aria-label="计费周期">
        <button type="button" :class="{ active: cycle === 'month' }" @click="cycle = 'month'">按月</button>
        <button type="button" :class="{ active: cycle === 'year' }" @click="cycle = 'year'">按年</button>
      </div>
    </div>
    <p class="pricing-note">价格由 Paddle 实时返回并按你的地区本地化展示。{{ isSandbox ? '当前为沙箱环境，使用测试支付方式，不会产生真实扣款。' : '' }}</p>
    <p v-if="envError" class="form-error" role="alert">{{ envError }}</p>
    <template v-else>
      <p v-if="sessionReady && !canCheckout" class="form-error" role="alert">沙箱测试阶段：结账仅对网站管理员开放，普通用户暂时无法结账。</p>
      <p v-if="loading" class="empty-state" role="status">正在读取实时价格…</p>
      <p v-else-if="error" class="empty-state" role="alert">{{ error }}　<button class="secondary-button" @click="loadPrices">重试</button></p>
      <div v-else class="pricing-grid">
        <article v-for="tier in tiers" :key="tier.name" class="work-panel pricing-card" :class="{ highlight: tier.highlight }">
          <span v-if="tier.highlight" class="status-pill">推荐</span>
          <h2>{{ tier.name }}</h2>
          <p class="tier-desc">{{ tier.description }}</p>
          <p class="tier-price"><template v-if="totals[tier.priceId[cycle]]"><strong>{{ totals[tier.priceId[cycle]] }}</strong><small> / {{ cycle === 'month' ? '月' : '年' }}</small></template><template v-else><strong>—</strong><small> 价格不可用</small></template></p>
          <ul class="tier-features"><li v-for="feature in tier.features" :key="feature">{{ feature }}</li></ul>
          <button v-if="tier.priceId[cycle]" class="primary-button" :disabled="busy === tier.name || !canCheckout" :title="canCheckout ? '' : '沙箱测试阶段，仅网站管理员可发起结账'" @click="subscribe(tier)">{{ busy === tier.name ? '正在打开结账…' : '订阅' }}</button>
          <p v-else class="tier-unconfigured">该档位尚未配置{{ cycle === 'month' ? '月' : '年' }}付价格</p>
        </article>
      </div>
    </template>
    <p class="login-fine">订阅交易由 Paddle 作为 Merchant of Record 处理付款与税务；取消、试用与退款适用 <router-link to="/legal/refunds">《Nexa 退款、试用与订阅政策》</router-link>。</p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { TIERS, type Tier, type BillingCycle } from '@/config/pricing';
import { platform, type Session } from '@/api/platform';

const cycle = ref<BillingCycle>('month'), loading = ref(true), error = ref(''), busy = ref<Tier['name'] | ''>('');
const totals = ref<Record<string, string>>({});
const tiers = TIERS;
// 沙箱测试门禁：仅 staff 账户可发起结账；普通用户看到明确提示，按钮禁用。
const session = ref<Session>(), sessionReady = ref(false);
const canCheckout = computed(() => session.value?.staff === 1);

// 环境必须显式配置：禁止在未设置环境变量时静默默认，避免连错 Paddle 账户。
const env = import.meta.env.VITE_PADDLE_ENV;
const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const envError = ref('');
if (env !== 'sandbox' && env !== 'production') envError.value = 'Paddle 环境未配置：请在构建环境中设置 VITE_PADDLE_ENV（sandbox 或 production），不要使用未声明的默认值。';
else if (!token) envError.value = '缺少 Paddle 客户端令牌：请设置 VITE_PADDLE_CLIENT_TOKEN（沙箱令牌以 test_ 开头）。';
const isSandbox = env === 'sandbox';

let paddlePromise: Promise<Paddle | undefined> | undefined;
function getPaddle() {
  paddlePromise ??= initializePaddle({ environment: env, token });
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
onMounted(() => { void loadPrices(); platform.session().then(result => { session.value = result; }).finally(() => { sessionReady.value = true; }); });

async function subscribe(tier: Tier) {
  busy.value = tier.name; error.value = '';
  try {
    const paddle = await getPaddle();
    if (!paddle) throw new Error('Paddle 初始化失败，请检查客户端令牌。');
    const priceId = tier.priceId[cycle.value];
    if (!priceId) throw new Error('该档位尚未配置价格。');
    // 已登录用户预填邮箱；未登录则交给结账页自行收集。
    const session = await platform.session();
    await paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(session?.email ? { customer: { email: session.email } } : {}),
      // 服务端履约层据此将 Paddle 客户关联到当前账户（webhook 回传 custom_data）。
      ...(session?.id ? { customData: { userId: session.id } } : {}),
      settings: { displayMode: 'overlay', variant: 'one-page', successUrl: `${window.location.origin}/welcome` }
    });
  } catch (e) { error.value = e instanceof Error ? e.message : '无法打开结账，请稍后重试。'; }
  finally { busy.value = ''; }
}
</script>
