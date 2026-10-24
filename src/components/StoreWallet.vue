<template>
  <section class="store-wallet">
    <NTokenWalletPanel ref="walletPanel" @loaded="wallet = $event" />
    <p v-if="loading" role="status">{{ $ui('正在读取钱包…') }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
    <template v-if="wallet">
      <p class="store-muted">{{ $ui('充值暂未开放；商品及内购不提供退款申请。') }}</p>
      <h3>{{ $ui('未使用充值代币退款') }}</h3><p>{{ $ui('申请冻结对应代币，经人工审批后原路退回；对应原充值交易的全部支付手续费由退款用户承担，同笔费用只扣一次。') }}</p>
      <p v-if="!lots.length" class="store-muted">{{ $ui('暂无已核验的充值批次。') }}</p>
      <form v-else class="store-form" @submit.prevent="submit">
        <label>{{ $ui('原充值批次') }}<select v-model="lotId" :aria-label="$ui('原充值批次')" required @change="quote = undefined"><option value="" disabled>{{ $ui('请选择') }}</option><option v-for="lot in lots" :key="lot.id" :value="lot.id">{{ lot.provider }} · {{ new Date(lot.paid_at).toLocaleDateString($locale) }} · {{ lot.available_tokens }} N · {{ lot.provider_transaction_id.slice(-8) }}</option></select></label>
        <p v-if="selected" class="store-muted">{{ $ui('原交易编号') }}：<span class="store-hash">{{ selected.provider_transaction_id }}</span></p>
        <label>{{ $ui('申请退回的N代币') }}<input v-model.number="tokens" type="number" min="1" :max="selected?.available_tokens || 0" step="1" required @input="quote = undefined" /></label>
        <label>{{ $ui('申请原因') }}<textarea v-model.trim="reason" rows="3" maxlength="2000" required /></label>
        <button class="secondary-button" type="button" :disabled="busy || !selected || tokens < 1" @click="preview">{{ $ui('核对退款费用') }}</button>
        <p v-if="quote?.feeAllocatedFen" class="store-muted">{{ $ui('该笔手续费已在此前审批中保留分配，不在本次重复扣取；审批不代表退款已经执行。') }}</p><div v-if="quote" class="store-muted"><p>{{ $ui('退款原金额') }}：{{ money(quote.grossFen) }}</p><p v-if="quote.approvalBlockedReason">{{ $ui(refundBlockReason(quote.approvalBlockedReason)) }}；{{ $ui('尚不能批准退款金额。') }}</p><p v-else>{{ $ui('支付平台手续费') }}：{{ money(quote.feeDeductionFen || 0) }} · {{ $ui('预计原路退回') }}：{{ money(quote.netFen || 0) }}</p></div>
        <button class="primary-button" :disabled="busy || !quote || !selected || tokens > selected.available_tokens">{{ $ui('提交退款申请') }}</button>
      </form>
      <p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
      <h3>{{ $ui('退款申请记录') }}</h3><p v-if="!requests.length" class="store-muted">{{ $ui('暂无申请。') }}</p>
      <article v-for="row in requests" :key="row.id" class="store-content-row"><div><strong>{{ row.requested_tokens }} N</strong><small>{{ new Date(row.created_at).toLocaleDateString($locale) }}</small></div><span class="status-pill">{{ $ui(financeState(row.state)) }}</span></article>
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { uiLocale } from '@/languages/localize';
import type { NTokenWallet } from '@/api/wallet';
import NTokenWalletPanel from '@/components/NTokenWalletPanel.vue';
import { commerce, financeState, refundBlockReason, newCommerceKey, type RechargeLot, type RefundQuote, type FinanceRequest } from '@/api/commerce';
import '@/styles/store.css';
const wallet = ref<NTokenWallet>(), lots = ref<RechargeLot[]>([]), requests = ref<FinanceRequest[]>([]), loading = ref(false), busy = ref(false), error = ref(''), message = ref('');
const walletPanel=ref<{refresh:()=>Promise<void>}>();
const lotId = ref(''), tokens = ref(1), reason = ref(''), quote = ref<RefundQuote>(), selected = computed(() => lots.value.find(lot => lot.id === lotId.value));
let requestKey = '', fingerprint = '';
const money = (fen: number) => new Intl.NumberFormat(uiLocale.value, { style: 'currency', currency: 'CNY' }).format(fen / 100);
async function load() { loading.value = true; try { const [charges, rows] = await Promise.all([commerce.lots(), commerce.refunds()]); lots.value = charges.data; requests.value = rows.data; await walletPanel.value?.refresh(); } catch (e) { error.value = e instanceof Error ? e.message : '钱包读取失败'; } finally { loading.value = false; } }
async function preview() { if (busy.value) return; busy.value = true; error.value = ''; try { quote.value = await commerce.quote(lotId.value, tokens.value); } catch (e) { error.value = e instanceof Error ? e.message : '退款费用读取失败'; } finally { busy.value = false; } }
async function submit() { if (busy.value) return; busy.value = true; error.value = ''; message.value = ''; const next = JSON.stringify([lotId.value, tokens.value, reason.value]); if (next !== fingerprint) { fingerprint = next; requestKey = newCommerceKey(); } try { await commerce.refund(lotId.value, tokens.value, reason.value, requestKey); message.value = '退款申请已提交，尚未执行退款。'; reason.value = ''; quote.value = undefined; fingerprint = ''; await load(); } catch (e) { error.value = e instanceof Error ? e.message : '退款申请失败'; } finally { busy.value = false; } }
onMounted(load);
</script>
<style scoped>
.store-wallet select{width:100%}
</style>
