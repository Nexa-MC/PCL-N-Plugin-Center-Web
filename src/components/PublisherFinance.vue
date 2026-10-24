<template>
  <section class="work-panel">
    <div class="section-heading"><h2>{{ $ui('商店订单收入与提现') }}</h2><button class="secondary-button" :disabled="busy" @click="load">{{ $ui('刷新') }}</button></div>
    <p>{{ $ui('订单实付金额按平台20%、作者80%精确分账。') }}</p><p class="store-muted">{{ $ui('当前仅记录申请与审批，不执行真实打款。') }}</p>
    <p v-if="error" role="alert" class="form-error">{{ $ui(error) }}</p>
    <template v-if="revenue"><div class="store-summary-grid"><div class="store-summary-cell"><strong>{{ money(revenue.earned_units) }}</strong><span>{{ $ui('累计订单收入') }}</span></div><div class="store-summary-cell"><strong>{{ money(revenue.available_units) }}</strong><span>{{ $ui('可申请提现') }}</span></div><div class="store-summary-cell"><strong>{{ money(revenue.reserved_units) }}</strong><span>{{ $ui('提现申请冻结') }}</span></div></div>
      <form class="store-form" @submit.prevent="submit"><label>{{ $ui('提现金额（人民币元，100元起）') }}<input v-model.trim="amount" type="text" inputmode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required /></label><button class="primary-button" :disabled="busy || revenue.available_units < 100000">{{ $ui('申请提现') }}</button></form>
    </template>
    <p v-if="message" role="status" class="form-success">{{ $ui(message) }}</p><h3>{{ $ui('提现申请记录') }}</h3><p v-if="!rows.length" class="store-muted">{{ $ui('暂无申请。') }}</p>
    <article v-for="row in rows" :key="row.id" class="store-content-row"><div><strong>{{ money((row.amount_fen || 0) * 10) }}</strong><small>{{ new Date(row.created_at).toLocaleDateString($locale) }}</small></div><span class="status-pill">{{ $ui(financeState(row.state)) }}</span></article>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ui, uiLocale } from '@/languages/localize';
import { commerce, cnyToFen, financeState, newCommerceKey, type Revenue, type FinanceRequest } from '@/api/commerce';
const revenue = ref<Revenue>(), rows = ref<FinanceRequest[]>([]), busy = ref(false), error = ref(''), message = ref(''), amount = ref('100.00');
let requestKey = '', fingerprint = '';
const money = (units: number) => Number.isSafeInteger(units) && units % 10 === 0 ? new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency: 'CNY' }).format(units / 1000) : ui('收入金额待核对');
async function load() { try { const [value, requests] = await Promise.all([commerce.revenue(), commerce.withdrawals()]); revenue.value = value; rows.value = requests.data; } catch (e) { error.value = e instanceof Error ? e.message : '收入读取失败'; } }
async function submit() { if (busy.value) return; busy.value = true; error.value = ''; message.value = ''; try { const fen = cnyToFen(amount.value); if (fingerprint !== String(fen)) { fingerprint = String(fen); requestKey = newCommerceKey(); } await commerce.withdraw(fen, requestKey); message.value = '提现申请已提交，等待人工审批。'; fingerprint = ''; await load(); } catch (e) { error.value = e instanceof Error ? e.message : '提现申请失败'; } finally { busy.value = false; } }
onMounted(load);
</script>
