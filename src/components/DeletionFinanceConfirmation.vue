<template>
  <section class="deletion-finance" :aria-label="$ui('注销前的收入确认')">
    <h3>{{ $ui('注销前的收入确认') }}</h3>
    <p v-if="loading" role="status">{{ $ui('正在核对未提现收入与待审提现…') }}</p>
    <p v-if="error" :role="required ? 'alert' : undefined">{{ $ui(error) }}</p>
    <template v-if="disclosure">
      <dl><div><dt>{{ $ui('商店未提现收入合计') }}</dt><dd>{{ money(disclosure.earnedUnits) }}</dd></div><div><dt>{{ $ui('其中待审核提现') }}</dt><dd>{{ money(disclosure.pendingUnits) }}</dd></div><div><dt>{{ $ui('其中已批准待打款') }}</dt><dd>{{ money(disclosure.approvedUnits) }}</dd></div></dl>
      <p>{{ $ui('待审及待打款金额已包含在合计中，不重复相加。') }}</p>
    </template>
    <p>{{ $ui('确认注销并经过7天冷静期后，未提现收入及待审、待打款提现不会支付，将被丢弃；冷静期内新增的剩余收入也适用。撤销注销可取消本次处置。') }}</p>
    <p>{{ $ui('本确认不影响适用法律规定的不可放弃权利。') }}</p>
    <label v-if="needsConfirmation && disclosure" class="accept-check"><input v-model="confirmed" type="checkbox" />{{ $ui('我已核对上述金额，并确认注销完成后这些金额不会提现且将被丢弃。') }}</label>
    <button class="secondary-button" type="button" :disabled="loading" @click="load">{{ $ui('重新核对收入') }}</button>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { request, isTestSession } from '@/api/platform';
import { uiLocale } from '@/languages/localize';
interface Disclosure { policy: 1; ledger: string; earnedUnits: number; pendingUnits: number; approvedUnits: number; exp: number; token: string }
const props=defineProps<{ accountId:string; required:boolean }>();
const emit=defineEmits<{ change:[value:{ready:boolean;token?:string;confirmed:boolean}] }>();
const disclosure=ref<Disclosure>(),confirmed=ref(false),loading=ref(false),error=ref('');
const needsConfirmation=computed(()=>props.required || (disclosure.value?.earnedUnits??0)>0);
const ready=computed(()=>!loading.value && (disclosure.value ? !needsConfirmation.value || confirmed.value : !props.required));
const money=(units:number)=>new Intl.NumberFormat(uiLocale.value,{style:'currency',currency:'CNY'}).format(units/1000);
let generation=0;
async function load(){const current=++generation;loading.value=true;confirmed.value=false;disclosure.value=undefined;error.value='';try{
  if(isTestSession()){disclosure.value={policy:1,ledger:'store_ntoken_v1',earnedUnits:0,pendingUnits:0,approvedUnits:0,exp:Math.floor(Date.now()/1000)+300,token:'local-preview-only'};return;}
  const value=await request<Disclosure>('/wallet/deletion-disclosure');
  if(current!==generation)return;
  if(value.policy!==1||value.ledger!=='store_ntoken_v1'||!value.token||value.exp<=Math.floor(Date.now()/1000)||[value.earnedUnits,value.pendingUnits,value.approvedUnits].some(n=>!Number.isSafeInteger(n)||n<0))throw new Error('注销收入金额尚未核验');
  disclosure.value=value;
}catch{if(current===generation)error.value=props.required?'暂时无法核验作者收入，不能提交注销；请重试或联系支持。':'商店收入核验暂不可用；如有未提现收入，请先联系支持核对。';}finally{if(current===generation)loading.value=false;}}
watch(()=>props.accountId,load,{immediate:true});
watch([ready,confirmed,disclosure],()=>emit('change',{ready:ready.value,token:disclosure.value?.token,confirmed:confirmed.value||!needsConfirmation.value}),{immediate:true});
</script>
<style scoped>
.deletion-finance{margin:24px 0;padding:18px;border:1px solid var(--market-border);border-radius:12px}.deletion-finance h3{margin:0 0 12px}.deletion-finance p{font-size:13px;margin:12px 0;line-height:1.7}.deletion-finance dl{margin:16px 0}.deletion-finance dl div{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:10px 0}.deletion-finance dt{color:var(--market-muted);font-size:13px}.deletion-finance dd{margin:0;font-weight:600;overflow-wrap:anywhere}.deletion-finance input{width:auto}
</style>
