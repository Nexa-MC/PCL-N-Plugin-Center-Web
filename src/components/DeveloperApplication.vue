<template>
  <section class="work-panel">
    <div class="section-heading"><h2>{{ $ui(kind === 'developer' ? '申请开发者资格' : '申请受信任开发者资格') }}</h2><button class="secondary-button" :disabled="busy" @click="load">{{ $ui('刷新') }}</button></div>
    <p>{{ $ui(kind === 'developer' ? '满足以下五项中的至少两项即可获得开发者资格。' : '满足以下六项中的至少三项即可获得受信任开发者资格。') }}</p>
    <p class="login-fine">{{ $ui('GitHub核验读取账号注册日期、仓库、关注者和组织成员身份，支持隐藏的组织成员关系；不会保存授权令牌。核验资料24小时内有效。') }}</p>
    <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
    <p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
    <template v-if="eligibility">
      <p><strong>{{ $ui('已核验 {0} / {1} 项',[eligibility.verifiedCount,eligibility.required]) }}</strong></p>
      <ol class="qualification-list">
        <li v-for="condition in eligibility.conditions" :key="condition.id">
          <div><strong>{{ $ui(condition.label) }}</strong><span class="status-pill">{{ $ui(condition.met ? '已满足' : condition.available === false ? '暂未接入' : '未满足') }}</span></div>
          <small v-if="condition.id === 'account-age' && condition.value">{{ $ui('注册时间：{0}',[new Date(String(condition.value)).toLocaleDateString($locale)]) }}</small>
          <small v-else-if="condition.id === 'repository' && condition.value">{{ condition.value }}</small>
          <small v-else-if="condition.id === 'followers' && condition.value !== null">{{ $ui('关注者：{0}',[Number(condition.value).toLocaleString($locale)]) }}</small>
          <label v-if="condition.id === 'core' && !condition.met" class="core-claim"><input v-model="coreContributor" type="checkbox" :disabled="busy || submitted" />{{ $ui('我是NexaCL核心贡献者，申请管理员审核此项。') }}</label>
        </li>
      </ol>
      <p v-if="eligibility.githubCheckedAt" class="login-fine">{{ $ui('最近核验：{0}',[new Date(eligibility.githubCheckedAt).toLocaleString($locale)]) }} · {{ $ui(eligibility.githubFresh ? '核验有效' : '请重新授权核验') }}</p>
      <p class="login-fine">{{ $ui('已核验项达到要求时直接授予；依赖核心贡献者申报时，须经管理员确认后授予。') }}</p>
    </template>
    <div class="actions"><button class="secondary-button" :disabled="busy" @click="authorize">{{ $ui('授权GitHub并核验条件') }}</button><button class="primary-button" :disabled="busy || !canSubmit || waitingForReview" @click="submit">{{ $ui(waitingForReview ? '已提交，等待管理员审核' : '提交资格申请') }}</button></div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { platform, type DeveloperEligibility, type DeveloperKind } from '@/api/platform';
const props=defineProps<{kind:DeveloperKind;initialError?:string}>();
const emit=defineEmits<{granted:[]}>();
const eligibility=ref<DeveloperEligibility>(),busy=ref(false),error=ref(props.initialError || ''),message=ref(''),coreContributor=ref(false),submitted=ref(false);
const canSubmit=computed(()=>{const e=eligibility.value;return !!e?.githubFresh && e.verifiedCount + Number(coreContributor.value && !e.conditions.find(c=>c.id==='core')?.met) >= e.required;});
const waitingForReview=computed(()=>submitted.value && (eligibility.value?.verifiedCount ?? 0) < (eligibility.value?.required ?? 2));
async function load(){busy.value=true;try{const data=await platform.developerEligibility();eligibility.value=props.kind==='developer'?data.developer:data.trustedDeveloper;submitted.value=data.applications.some(a=>a.kind===props.kind&&a.state==='pending');if(submitted.value)coreContributor.value=true;if(props.kind==='developer'?data.roles.developer:data.roles.trustedDeveloper)emit('granted');}catch(e){error.value=e instanceof Error?e.message:'暂时无法读取申请条件';}finally{busy.value=false;}}
function authorize(){error.value='';try{platform.authorizeDeveloperGithub();}catch(e){error.value=e instanceof Error?e.message:'无法开始GitHub核验';}}
async function submit(){if(!canSubmit.value || busy.value)return;busy.value=true;error.value='';try{const result=await platform.applyDeveloper(props.kind,coreContributor.value);if(result.state==='approved'){message.value='资格已授予';emit('granted');}else{submitted.value=true;message.value='申请已提交，核心贡献者身份等待管理员审核。';}}catch(e){error.value=e instanceof Error?e.message:'申请提交失败，请重试';}finally{busy.value=false;}}
onMounted(load);
</script>
<style scoped>
.qualification-list{padding:0;list-style:none;margin:20px 0;counter-reset:condition}.qualification-list li{counter-increment:condition;border-top:1px solid var(--market-border);padding:15px 0}.qualification-list li>div{display:flex;align-items:baseline;gap:12px;justify-content:space-between}.qualification-list strong{font-size:13px;line-height:1.7}.qualification-list strong:before{content:counter(condition) ". ";color:var(--market-muted)}.qualification-list small{display:block;color:var(--market-muted);margin-top:6px;overflow-wrap:anywhere}.qualification-list .status-pill{flex-shrink:0}.core-claim{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.7;margin-top:10px;color:var(--market-muted)}.core-claim input{margin-top:4px}.actions{flex-wrap:wrap;margin-top:18px}
</style>
