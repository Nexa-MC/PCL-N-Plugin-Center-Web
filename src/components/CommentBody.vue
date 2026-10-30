<template><template v-for="(part,i) in parts" :key="i"><a v-if="part.uid" :href="profileUrl(part.profileId || part.uid)" class="reply-mention">{{ part.text }}</a><template v-else>{{ part.text }}</template></template></template>
<script setup lang="ts">
import {computed} from 'vue';import{profileUrl,type CommentMention}from'@/api/store';const props=defineProps<{text:string;mentions?:CommentMention[]}>();
const parts=computed(()=>{const result:{text:string;uid?:string;profileId?:string}[]=[],mentions=[...(props.mentions||[])].sort((a,b)=>a.start-b.start);let offset=0;for(const m of mentions){if(!Number.isInteger(m.start)||!Number.isInteger(m.end)||m.start<offset||m.end>props.text.length||m.end<=m.start||props.text[m.start]!=='@')continue;result.push({text:props.text.slice(offset,m.start)},{text:'@'+m.uid,uid:m.uid,profileId:m.uid==='ghost'?'ghost':m.profileId});offset=m.end;}result.push({text:props.text.slice(offset)});return result;});
</script>
