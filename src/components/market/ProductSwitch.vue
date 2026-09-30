<template>
  <div ref="root" class="product-switch" role="group" :aria-label="label">
    <span class="selection" :style="{transform:`translateX(${position}px)`}" aria-hidden="true" />
    <button v-for="(item,index) in options" :key="item.id" :aria-pressed="modelValue === item.id" @click="$emit('update:modelValue',item.id)" @keydown="navigate($event,index)">{{ item.label }}<small v-if="index === 0">Alpha</small></button>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
const props = defineProps<{modelValue:string;label:string}>();
const emit = defineEmits<{ 'update:modelValue':[value:string] }>();
const options=[{id:'nexa',label:'NexaCL 2.0'},{id:'legacy',label:'PCL N 1.x'}];
const root=ref<HTMLElement>(); const position=ref(0);
let target=0, velocity=0, frame=0, last=0, observer:ResizeObserver;
let reduced:MediaQueryList;
function tick(time:number) {
  const dt=Math.min((time-last)/1000,.032); last=time;
  // Critically damped spring; retain velocity when the destination changes.
  velocity+=(320*(target-position.value)-36*velocity)*dt;
  position.value+=velocity*dt;
  if(Math.abs(target-position.value)<.05 && Math.abs(velocity)<.1){position.value=target;frame=0;return;}
  frame=requestAnimationFrame(tick);
}
function measure(animate=true){
  const buttons=root.value?.querySelectorAll('button');
  const selected=buttons?.[props.modelValue==='legacy'?1:0];
  if(!selected)return;
  target=selected.offsetLeft-5;
  if(!animate || reduced.matches){cancelAnimationFrame(frame);frame=0;velocity=0;position.value=target;}
  else if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}
}
function navigate(event:KeyboardEvent,index:number){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;
  emit('update:modelValue',options[next].id);root.value?.querySelectorAll('button')[next]?.focus();
}
const onMotionChange=()=>measure(false);
onMounted(()=>{reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',onMotionChange);observer=new ResizeObserver(()=>measure(false));observer.observe(root.value!);measure(false);});
watch(()=>props.modelValue,()=>measure(),{flush:'post'});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();reduced?.removeEventListener('change',onMotionChange);});
</script>
<style scoped>
.product-switch{position:relative;display:grid;grid-template-columns:1fr 1fr;isolation:isolate;padding:5px;border-radius:50px;background:var(--market-surface-soft);width:min(100%,420px);margin:0 auto 40px}.selection{position:absolute;z-index:-1;top:5px;bottom:5px;left:5px;width:calc(50% - 5px);border-radius:40px;background:var(--market-surface);box-shadow:0 2px 8px #0000000a;will-change:transform}.product-switch button{border:0;background:none;color:var(--market-muted);padding:13px 8px;border-radius:40px;font-size:15px;white-space:nowrap}.product-switch button[aria-pressed=true]{color:var(--market-text);font-weight:550}.product-switch small{font-size:11px;color:var(--market-accent);margin-left:6px}@media(max-width:380px){.product-switch button{font-size:13px}}
</style>
