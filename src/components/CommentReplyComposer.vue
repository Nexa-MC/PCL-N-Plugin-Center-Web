<template><form class="store-form reply-form" @submit.prevent="$emit('submit')"><p class="reply-context">{{ $ui('回复 {0}',[author]) }}<span>{{ preview }}</span></p><label>{{ $ui('回复内容') }}<MentionTextarea ref="input" :item-id="itemId" :model-value="modelValue" @update:model-value="$emit('update:modelValue',$event)" maxlength="2000" required rows="3" /></label><div class="actions"><button class="primary-button" :disabled="busy || !modelValue.trim()">{{ $ui('回复') }}</button><button type="button" class="secondary-button" :disabled="busy" @click="$emit('cancel')">{{ $ui('取消') }}</button></div></form></template>
<script setup lang="ts">
import {computed,onMounted,ref} from 'vue';
import MentionTextarea from './MentionTextarea.vue';
const props=defineProps<{itemId:string;author:string;body:string;modelValue:string;busy:boolean}>();
defineEmits<{'update:modelValue':[string];submit:[];cancel:[]}>();
const input=ref<{focus:()=>void}>(),preview=computed(()=>Array.from(props.body).slice(0,100).join('')+(Array.from(props.body).length>100?'…':''));
onMounted(()=>{input.value?.focus();});
</script>
