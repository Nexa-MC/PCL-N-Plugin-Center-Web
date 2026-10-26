<template>
  <main class="feedback-page"><span class="eyebrow">NexaCL</span><h1>{{ $ui('分享你的使用体验') }}</h1>
    <p>{{ $ui('填写自愿，请勿填写密码、账户令牌或其他敏感信息。反馈保存 180 天。') }}</p>
    <p v-if="sent" role="status">{{ $ui('感谢反馈，我们已收到。') }}</p>
    <form v-else class="feedback-form" @submit.prevent="submit">
      <fieldset><legend>{{ $ui('你对当前版本的满意度') }}</legend><label v-for="n in 5" :key="n"><input v-model="rating" type="radio" :value="n" required />{{ n }}</label><small>{{ $ui('1 非常不满意 · 5 非常满意') }}</small></fieldset>
      <label>{{ $ui('最希望改善的部分') }}<select v-model="area"><option v-for="(label,key) in areas" :key="key" :value="key">{{ $ui(label) }}</option></select></label>
      <fieldset class="dimensions"><legend>{{ $ui('各方面的体验（可选）') }}</legend><small>{{ $ui('未使用的功能可以跳过，1 表示很差，5 表示很好。') }}</small><label v-for="(label,key) in dimensions" :key="key">{{ $ui(label) }}<select v-model="scores[key]"><option value="">{{ $ui('未使用 / 跳过') }}</option><option v-for="n in 5" :key="n" :value="n">{{ n }}</option></select></label></fieldset>
      <label>{{ $ui('使用频率（可选）') }}<select v-model="frequency"><option value="">{{ $ui('跳过') }}</option><option v-for="item in frequencies" :key="item" :value="item">{{ $ui(item) }}</option></select></label>
      <label>{{ $ui('最希望新增或改进的功能（可选）') }}<textarea v-model="wish" maxlength="300" rows="3" /></label>
      <label>{{ $ui('补充说明（可选）') }}<textarea v-model="comment" maxlength="1200" rows="5" :placeholder="$ui('如遇到问题，请描述操作步骤、预期结果与实际结果。')" /></label>
      <p v-if="error" role="alert" class="form-error">{{ error }}</p><button class="primary-button" :disabled="busy || !rating">{{ $ui(busy ? '正在提交…' : '提交反馈') }}</button>
    </form>
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '@/api/platform';
const route=useRoute(), rating=ref(0),area=ref('general'),comment=ref(''),busy=ref(false),sent=ref(false),error=ref(''), id=crypto.randomUUID();
const areas={general:'整体体验',launch:'游戏启动',install:'安装与更新',resources:'资源浏览',accounts:'账户登录',performance:'性能与内存',interface:'界面与操作'};
const dimensions={startup:'启动器启动速度',launch:'游戏启动体验',install:'安装、下载与更新',resources:'资源浏览与搜索',accounts:'账户登录',memory:'性能与内存占用',interface:'界面与操作',stability:'稳定性与错误恢复'};
const scores=ref<Record<string,string|number>>({}),frequency=ref(''),wish=ref('');
const frequencies=['每天使用','每周使用数次','偶尔使用','首次体验'];
function answers(){return [Object.entries(dimensions).filter(([key])=>scores.value[key]).map(([key,label])=>`${label}：${scores.value[key]}/5`).join('\n'),frequency.value?`使用频率：${frequency.value}`:'',wish.value.trim()?`希望改进：${wish.value.trim()}`:'',comment.value.trim()].filter(Boolean).join('\n\n');}
async function submit(){if(busy.value||!rating.value)return;busy.value=true;error.value='';try{const version=String(route.query.version||'2.0.0');await request('/community/surveys',{method:'POST',body:JSON.stringify({id,rating:rating.value,area:area.value,comment:answers(),version})});sent.value=true;}catch(e){error.value=e instanceof Error?e.message:'提交失败，请重试。';}finally{busy.value=false;}}
</script>
<style scoped>
.feedback-page{max-width:640px;margin:64px auto;padding:0 24px}.feedback-page h1{font-size:2rem;margin:12px 0 16px}.feedback-page p{line-height:1.7}.feedback-form{display:grid;gap:24px;margin-top:32px}.feedback-form>label{display:grid;gap:8px}.feedback-form textarea,.feedback-form select{font:inherit;padding:12px;border:1px solid var(--border-color,#d6dce5);border-radius:10px;background:var(--bg-color,#fff);color:inherit}.feedback-form fieldset{border:0;padding:0}.feedback-form legend{margin-bottom:12px}.feedback-form fieldset label{display:inline-flex;gap:6px;margin-right:20px}.feedback-form small{display:block;margin-top:12px;color:var(--text-secondary,#667085)}
.dimensions label{display:grid!important;grid-template-columns:minmax(0,1fr) 150px;align-items:center;gap:16px!important;margin:16px 0 0!important}.dimensions select{font:inherit;padding:10px;border:1px solid var(--border-color,#d6dce5);border-radius:8px;background:var(--bg-color,#fff);color:inherit}@media(max-width:480px){.dimensions label{grid-template-columns:minmax(0,1fr) 120px}}
</style>
