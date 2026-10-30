<template>
 <section class="work-panel discussion"><div class="section-heading"><div><h2>{{ $ui('评论') }}</h2><p class="store-muted">{{ $ui('评论用于讨论，不计入评分与评价。') }}</p></div><button class="secondary-button" :disabled="loading" @click="load(false)">{{ $ui('刷新') }}</button></div>
 <form v-if="session" class="store-form" @submit.prevent="post()"><label>{{ $ui('发表评论') }}<MentionTextarea :item-id="itemId" v-model="draft" maxlength="2000" required rows="3" /></label><button class="primary-button" :disabled="busy || !draft.trim()">{{ $ui('发表评论') }}</button></form><router-link v-else class="secondary-button" :to="{path:'/login',query:{return:route.fullPath}}">{{ $ui('登录后评论') }}</router-link>
 <p v-if="notice" class="form-success" role="status">{{ $ui(notice) }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><p v-if="loading && !comments.length" role="status">{{ $ui('正在读取评论…') }}</p><p v-else-if="!comments.length && !error" class="store-muted">{{ $ui('暂无评论。') }}</p>
 <CommentThread v-for="comment in comments" :key="comment.id" :item-id="itemId" :comment="comment" :session="session" :depth="0" @refresh="load(false)" />
 <button v-if="comments.length < total" class="secondary-button" :disabled="loading" @click="load(true)">{{ $ui('更多评论') }}</button>
 </section>
</template>
<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref} from 'vue';
import {useRoute} from 'vue-router';
import {store,type StoreComment} from '@/api/store';
import type {Session} from '@/api/platform';
import MentionTextarea from './MentionTextarea.vue';
import CommentThread from './CommentThread.vue';
const props=defineProps<{itemId:string;session?:Session}>(),route=useRoute();
const comments=ref<StoreComment[]>([]),total=ref(0),offset=ref(0),loading=ref(false),busy=ref(false),error=ref(''),notice=ref(''),draft=ref('');
let active=true,requestKey='',fingerprint='';
async function load(more=false){if(loading.value)return;loading.value=true;error.value='';try{const page=await store.comments(props.itemId,more?offset.value:0);if(!active)return;comments.value=more?[...new Map([...comments.value,...page.data].map(c=>[c.id,c])).values()]:page.data;offset.value=(more?offset.value:0)+page.data.length;total.value=page.pagination.total;}catch(e){if(active)error.value=e instanceof Error?e.message:'评论操作失败，请重试。';}finally{if(active)loading.value=false;}}
async function post(){if(busy.value)return;busy.value=true;error.value='';const value={body:draft.value};if(draft.value!==fingerprint){fingerprint=draft.value;requestKey=crypto.randomUUID();}try{await store.comment(props.itemId,value,requestKey);if(!active)return;draft.value='';fingerprint='';await load(false);}catch(e){if(active)error.value=e instanceof Error?e.message:'评论操作失败，请重试。';}finally{if(active)busy.value=false;}}
onMounted(()=>void load());onBeforeUnmount(()=>{active=false;});
</script>
<style>
.discussion .store-form{margin-block:20px}.comment-entry{display:flex;gap:14px;margin-top:24px;min-width:0}.comment-avatar{display:grid;place-items:center;flex-shrink:0;width:36px;height:36px;border-radius:50%;background:var(--market-accent-soft);color:var(--nc-accent);font-weight:650}.comment-content{flex:1;min-width:0}.comment-byline{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:13px}.comment-byline time,.comment-byline small,.comment-deleted{color:var(--market-muted);font-size:12px}.comment-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;margin-top:8px}.reply-mention{color:var(--nc-accent)}.comment-actions{display:flex;gap:16px;margin-top:6px}.comment-actions button,.replies-toggle{background:none;border:0;padding:8px 0;color:var(--nc-accent);font-size:13px;min-height:40px}.comment-replies{margin:12px 0 0 8px;padding-left:16px;border-left:2px solid var(--market-border)}.comment-replies>.comment-entry:first-child{margin-top:0}.reply-context{font-size:13px;color:var(--nc-accent)}.reply-context span{display:block;margin-top:6px;padding-left:10px;border-left:2px solid var(--market-border);color:var(--market-muted);white-space:pre-wrap;overflow-wrap:anywhere}.reply-form{padding:14px;background:var(--market-surface-soft);border-radius:10px}.reply-mention{display:inline-block;margin-right:4px}.comment-replies .comment-avatar{width:28px;height:28px}.comment-replies.deep-thread{padding-left:6px;margin-left:0}.discussion textarea{width:100%;box-sizing:border-box}.comment-byline .comment-author{font-weight:650;color:var(--market-text);max-width:100%;overflow-wrap:anywhere}.comment-byline .comment-author:hover{text-decoration:underline;color:var(--nc-accent)}.reply-mention{max-width:100%;overflow-wrap:anywhere}.comment-byline strong{overflow-wrap:anywhere;max-width:100%}@media(max-width:600px){.comment-entry{gap:8px}.comment-avatar{width:28px;height:28px}.comment-replies .comment-entry{gap:6px}.comment-replies{margin-left:0;padding-left:12px}.comment-replies .comment-avatar{display:none}}
</style>
