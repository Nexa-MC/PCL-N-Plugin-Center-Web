<template>
  <section class="wallet-tokens">
    <div class="section-heading"><h3>{{ $ui('N代币') }}</h3><button class="secondary-button" type="button" :disabled="loading" @click="load">{{ $ui('刷新') }}</button></div>
    <p>{{ $ui('1元人民币＝10 N代币，余额与商品价格均为整数。') }}</p>
    <p v-if="loading" role="status">{{ $ui('正在读取钱包…') }}</p>
    <p v-if="error" role="status">{{ $ui(error) }}</p>
    <template v-if="wallet">
      <dl><div><dt>{{ $ui('可用N代币') }}</dt><dd>{{ wallet.productionConnected ? wallet.availableBalance : '—' }}</dd></div><div><dt>{{ $ui('退款申请冻结') }}</dt><dd>{{ wallet.productionConnected ? wallet.reservedForRefunds : '—' }}</dd></div></dl>
      <p v-if="!wallet.productionConnected">{{ $ui('余额暂不可用；充值与真实结算尚未开放。') }}</p>
    </template>
    <p>{{ $ui('N代币购买暂未开放。') }}</p><button class="primary-button" type="button" disabled>{{ $ui('购买（暂未开放）') }}</button>
    <template v-if="wallet?.productionConnected">
      <h3>{{ $ui('钱包流水') }}</h3><p v-if="entriesError" role="status">{{ $ui('暂时无法读取钱包流水，请重试。') }}</p><p v-else-if="!entries.length">{{ $ui('暂无钱包流水。') }}</p>
      <article v-for="row in entries" :key="`${row.kind}:${row.id}`" class="token-entry"><div><strong>{{ $ui(entryKind(row.kind)) }}</strong><small>{{ new Date(row.created_at).toLocaleString($locale) }}</small></div><span>{{ row.delta > 0 ? '+' : '' }}{{ row.delta }} N</span></article>
      <div v-if="total > 50" class="actions"><button class="secondary-button" :disabled="loading || offset === 0" @click="page(-50)">{{ $ui('上一页') }}</button><span>{{ offset + 1 }}–{{ Math.min(offset + 50, total) }} / {{ total }}</span><button class="secondary-button" :disabled="loading || offset + 50 >= total" @click="page(50)">{{ $ui('下一页') }}</button></div>
    </template>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ntokenWallet, type NTokenWallet, type NTokenEntry } from '@/api/wallet';
const wallet=ref<NTokenWallet>(),entries=ref<NTokenEntry[]>([]),loading=ref(false),error=ref(''),entriesError=ref(false),offset=ref(0),total=ref(0);
const emit=defineEmits<{loaded:[wallet:NTokenWallet|undefined]}>();
const entryKind=(kind:string)=>({purchase:'商品购买',recharge:'充值入账',forfeiture:'注销余额处置'}[kind] || kind);
async function load(){if(loading.value)return;loading.value=true;error.value='';entriesError.value=false;
  const [balance,history]=await Promise.allSettled([ntokenWallet.read(),ntokenWallet.entries(offset.value)]);
  if(balance.status==='fulfilled' && balance.value?.ledger==='nexa_d1_ntoken_v1' && balance.value.amountUnit==='integer'
    && typeof balance.value.productionConnected==='boolean'
    && [balance.value.balance,balance.value.availableBalance,balance.value.reservedForRefunds].every(n=>Number.isSafeInteger(n)&&n>=0)
    && balance.value.availableBalance<=balance.value.balance-balance.value.reservedForRefunds){wallet.value=balance.value;}else{wallet.value=undefined;error.value='钱包服务尚未启用或暂不可用，余额不能确认为零。';}
  emit('loaded',wallet.value);
  if(history.status==='fulfilled' && Array.isArray(history.value?.data) && Number.isSafeInteger(history.value.pagination?.total) && history.value.pagination.total>=0){entries.value=history.value.data;total.value=history.value.pagination.total;}else{entries.value=[];total.value=0;offset.value=0;entriesError.value=true;}
  loading.value=false;
}
function page(delta:number){offset.value=Math.max(0,offset.value+delta);void load();}
onMounted(load);
defineExpose({refresh:load});
</script>
<style scoped>
.wallet-tokens>p{margin:14px 0;font-size:13px;line-height:1.7}.wallet-tokens dl{margin:20px 0}.wallet-tokens dl div{display:flex;justify-content:space-between;gap:16px;margin:12px 0}.wallet-tokens dt{color:var(--market-muted)}.wallet-tokens dd{margin:0;font-weight:600;overflow-wrap:anywhere}.wallet-tokens h3{margin:20px 0 10px}.token-entry{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--market-border);font-size:13px}.token-entry small{display:block;color:var(--market-muted);margin-top:5px}.token-entry>span{white-space:nowrap}
</style>
