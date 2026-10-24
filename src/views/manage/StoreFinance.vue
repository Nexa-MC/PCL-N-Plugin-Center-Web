<template>
  <section class="store-page">
    <div class="section-heading"><h1>{{ $ui('财务申请审核') }}</h1><div class="actions"><router-link class="secondary-button" to="/manage/store">{{ $ui('商店审核') }}</router-link><router-link class="secondary-button" to="/manage/store/security">{{ $ui('制品安全') }}</router-link></div></div>
    <p class="store-muted">{{ $ui('批准只记录审批并冻结金额，不执行真实打款或退款。') }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
    <section class="work-panel"><div class="section-heading"><h2>{{ $ui('账户同步状态') }}</h2><button class="secondary-button" :disabled="busy || !sync?.enabled" @click="recover">{{ $ui('执行同步与对账') }}</button></div>
      <template v-if="sync"><p>{{ $ui(sync.enabled ? !sync.ready ? '同步尚未就绪' : '同步已就绪' : '持续同步未启用') }}</p><p v-if="sync.errorCode" class="store-muted">{{ sync.errorCode }}</p><p class="store-muted">{{ $ui('事件游标') }}：{{ sync.cursor }} · {{ $ui('最近成功') }}：{{ sync.lastSuccessAt ? new Date(sync.lastSuccessAt).toLocaleString($locale) : '—' }}</p></template>
    </section>
    <div class="actions" role="group" :aria-label="$ui('申请类型')"><button class="secondary-button" :aria-pressed="kind === 'withdrawals'" @click="select('withdrawals')">{{ $ui('提现申请') }}</button><button class="secondary-button" :aria-pressed="kind === 'token-refunds'" @click="select('token-refunds')">{{ $ui('代币退款申请') }}</button><button class="secondary-button" :disabled="busy" @click="load">{{ $ui('刷新') }}</button></div>
    <p v-if="!rows.length" class="store-muted">{{ $ui('暂无申请。') }}</p>
    <article v-for="row in rows" :key="row.id" class="work-panel"><div class="section-heading"><h2>{{ kind === 'withdrawals' ? money(row.amount_fen || 0) : `${row.requested_tokens} N` }}</h2><span class="status-pill">{{ $ui(financeState(row.state)) }}</span></div>
      <p class="store-hash">{{ row.id }}</p><p>{{ row.reason }}</p><p class="store-muted">{{ new Date(row.created_at).toLocaleString($locale) }}</p>
      <template v-if="row.state === 'pending' || row.state === 'pending_review'">
        <button v-if="kind === 'token-refunds'" class="secondary-button" :disabled="busy" @click="checkFee(row)">{{ $ui('核验原交易与费用') }}</button>
        <div v-if="quotes[row.id]" class="store-muted"><p>{{ quotes[row.id].originalPayment.provider }} · <span class="store-hash">{{ quotes[row.id].originalPayment.transactionId }}</span></p><p v-if="quotes[row.id].approvalBlockedReason">{{ $ui(refundBlockReason(quotes[row.id].approvalBlockedReason!)) }}</p><p v-else>{{ $ui('退款原金额') }} {{ money(quotes[row.id].grossFen) }} · {{ $ui('支付平台手续费') }} {{ money(quotes[row.id].feeDeductionFen || 0) }} · {{ $ui('预计原路退回') }} {{ money(quotes[row.id].netFen || 0) }}</p></div>
        <form class="store-form" @submit.prevent="decide(row, 'approve')"><label>{{ $ui('审核说明') }}<textarea v-model="notes[row.id]" maxlength="2000" rows="3" required /></label><div class="actions"><button class="primary-button" :disabled="busy || !notes[row.id]?.trim() || (kind === 'token-refunds' && (!quotes[row.id] || Boolean(quotes[row.id].approvalBlockedReason)))">{{ $ui('批准申请') }}</button><button class="secondary-button" type="button" :disabled="busy || !notes[row.id]?.trim()" @click="decide(row, 'reject')">{{ $ui('拒绝申请') }}</button></div></form>
      </template><p v-else>{{ row.review_note }}</p>
    </article>
  </section>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { uiLocale } from '@/languages/localize';
import { commerce, financeState, refundBlockReason, type FinanceRequest, type RefundQuote, type SyncStatus } from '@/api/commerce';
import '@/styles/store.css';
const kind = ref<'withdrawals' | 'token-refunds'>('withdrawals'), rows = ref<FinanceRequest[]>([]), sync = ref<SyncStatus>(), quotes = reactive<Record<string, RefundQuote>>({}), notes = reactive<Record<string, string>>({});
const busy = ref(false), error = ref(''), message = ref('');
const money = (fen: number) => new Intl.NumberFormat(uiLocale.value, { currency: 'CNY', style: 'currency' }).format(fen / 100);
let generation = 0;
async function load() { const current = ++generation; error.value = ''; try { const [value, state] = await Promise.all([commerce.adminRequests(kind.value), commerce.syncStatus()]); if (current === generation) { rows.value = value.data; sync.value = state; } } catch (e) { if (current === generation) error.value = e instanceof Error ? e.message : '申请读取失败'; } }
function select(value: 'withdrawals' | 'token-refunds') { if (busy.value) return; kind.value = value; rows.value = []; void load(); }
async function checkFee(row: FinanceRequest) { busy.value = true; error.value = ''; try { quotes[row.id] = (await commerce.refundDetails(row.id)).quote; } catch (e) { error.value = e instanceof Error ? e.message : '退款费用读取失败'; } finally { busy.value = false; } }
async function decide(row: FinanceRequest, decision: 'approve' | 'reject') { if (busy.value) return; busy.value = true; error.value = ''; message.value = ''; try { await commerce.review(kind.value, row, decision, notes[row.id]); message.value = '审核结果已记录，尚未执行款项。'; await load(); } catch (e) { error.value = e instanceof Error ? e.message : '审核提交失败'; } finally { busy.value = false; } }
async function recover() { if (busy.value) return; busy.value = true; error.value = ''; try { const result = await commerce.sync(); message.value = result.status === 'ready' ? '本轮同步已完成。' : '同步尚未完成，可继续执行。'; await load(); } catch (e) { error.value = e instanceof Error ? e.message : '同步失败'; } finally { busy.value = false; } }
onMounted(load);
</script>
