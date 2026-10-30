<template>
 <StoreCommentEntry :item-id="itemId" :comment="comment" :session="session" :can-reply="!comment.deleted && !locked" @reply="replying=!replying" @changed="$emit('refresh')">
  <p v-if="notice" class="form-success" role="status">{{ $ui(notice) }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
  <CommentReplyComposer v-if="replying && session" v-model="draft" :author="comment.author_name" :body="comment.body" :busy="busy" @submit="post" @cancel="replying=false" />
  <div v-if="visible" class="comment-replies" :class="{'deep-thread':depth>=3}" :aria-label="$ui('回复串')">
   <CommentThread v-for="child in children" :key="child.id" :item-id="itemId" :comment="child" :session="session" :depth="depth+1" :locked="locked || (depth===0 && Boolean(comment.deleted))" @refresh="reload" />
   <p v-if="loading" role="status">{{ $ui('正在读取评论…') }}</p>
  </div>
  <button v-if="!visible && count>0" class="replies-toggle" :disabled="loading" @click="preview">{{ $ui('查看前2条回复（共{0}条）',[count]) }}</button>
  <button v-else-if="visible && offset<count" class="replies-toggle" :disabled="loading" @click="expand">{{ $ui(expanded ? '再加载最多50条回复' : '展开回复（共{0}条）',[count]) }}</button>
  <button v-if="visible && count>0 && (depth>0 || expanded)" class="replies-toggle" :disabled="loading" @click="collapse">{{ $ui('收起回复') }}</button>
 </StoreCommentEntry>
</template>
<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref,watch} from 'vue';
import {store,type StoreComment} from '@/api/store';
import type {Session} from '@/api/platform';
import StoreCommentEntry from './StoreCommentEntry.vue';
import CommentReplyComposer from './CommentReplyComposer.vue';
const props=defineProps<{itemId:string;comment:StoreComment;session?:Session;depth:number;locked?:boolean}>();defineEmits<{refresh:[]}>();
const children=ref<StoreComment[]>([]),count=ref(props.comment.reply_count),offset=ref(0),visible=ref(props.depth===0),expanded=ref(false),loading=ref(false),replying=ref(false),draft=ref(''),busy=ref(false),error=ref(''),notice=ref('');
let active=true,requestKey='',fingerprint='';
watch(()=>props.comment.reply_count,value=>count.value=value);
async function load(more=false,take=2){if(loading.value)return false;loading.value=true;error.value='';try{const page=await store.comments(props.itemId,more?offset.value:0,props.comment.id,take);if(!active)return false;children.value=more?[...new Map([...children.value,...page.data].map(c=>[c.id,c])).values()]:page.data;offset.value=(more?offset.value:0)+page.data.length;count.value=page.pagination.total;return true;}catch(e){if(active)error.value=e instanceof Error?e.message:'评论操作失败，请重试。';return false;}finally{if(active)loading.value=false;}}
async function preview(){if(await load(false,2)){visible.value=true;expanded.value=false;}}
async function expand(){if(await load(expanded.value,50)){visible.value=true;expanded.value=true;}}
function collapse(){if(props.depth===0){children.value=children.value.slice(0,2);offset.value=children.value.length;}else{visible.value=false;children.value=[];offset.value=0;}expanded.value=false;}
function reload(){void load(false,expanded.value?50:2);}
async function post(){if(busy.value)return;busy.value=true;error.value='';const value={body:draft.value,rootId:props.comment.root_id||props.comment.id,replyToId:props.comment.id},serialized=JSON.stringify(value);if(serialized!==fingerprint){fingerprint=serialized;requestKey=crypto.randomUUID();}try{await store.comment(props.itemId,value,requestKey);if(!active)return;draft.value='';fingerprint='';replying.value=false;notice.value='回复已发布。';count.value++;await preview();}catch(e){if(active)error.value=e instanceof Error?e.message:'评论操作失败，请重试。';}finally{if(active)busy.value=false;}}
onMounted(()=>{if(props.depth===0 && count.value>0)void preview();});onBeforeUnmount(()=>{active=false;});
</script>
