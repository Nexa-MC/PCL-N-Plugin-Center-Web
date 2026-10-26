<template>
  <main class="feedback-page"><span class="eyebrow">NexaCL</span><h1>{{ $ui('分享你的使用体验') }}</h1>
    <p>{{ $ui('填写自愿，请勿填写密码、账户令牌或其他敏感信息。反馈保存 180 天。') }}</p>
    <p v-if="sent" role="status">{{ $ui('感谢反馈，我们已收到。') }}</p>
    <form v-else class="feedback-form" @submit.prevent="submit">
      <fieldset><legend>{{ $ui('你对当前版本的满意度') }}</legend><label v-for="n in 5" :key="n"><input v-model="rating" type="radio" :value="n" required />{{ n }}</label><small>{{ $ui('1 非常不满意 · 5 非常满意') }}</small></fieldset>
      <label>{{ $ui('最希望改善的部分') }}<select v-model="area"><option v-for="(label,key) in areas" :key="key" :value="key">{{ $ui(label) }}</option></select></label>
      <label>{{ $ui('补充说明（可选）') }}<textarea v-model="comment" maxlength="2000" rows="5" /></label>
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
async function submit(){if(busy.value||!rating.value)return;busy.value=true;error.value='';try{const version=String(route.query.version||'2.0.0');await request('/community/surveys',{method:'POST',body:JSON.stringify({id,rating:rating.value,area:area.value,comment:comment.value,version})});sent.value=true;}catch(e){error.value=e instanceof Error?e.message:'提交失败，请重试。';}finally{busy.value=false;}}
</script>
<style scoped>
.feedback-page{max-width:640px;margin:64px auto;padding:0 24px}.feedback-page h1{font-size:2rem;margin:12px 0 16px}.feedback-page p{line-height:1.7}.feedback-form{display:grid;gap:24px;margin-top:32px}.feedback-form>label{display:grid;gap:8px}.feedback-form textarea,.feedback-form select{font:inherit;padding:12px;border:1px solid var(--border-color,#d6dce5);border-radius:10px;background:var(--bg-color,#fff);color:inherit}.feedback-form fieldset{border:0;padding:0}.feedback-form legend{margin-bottom:12px}.feedback-form fieldset label{display:inline-flex;gap:6px;margin-right:20px}.feedback-form small{display:block;margin-top:12px;color:var(--text-secondary,#667085)}
</style>
