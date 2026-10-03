<template><button class="language-control" type="button" :aria-label="label" :title="label" @click="toggle"><span class="full" :lang="targetTag">{{ full }}</span><span class="short" :lang="targetTag" aria-hidden="true">{{ short }}</span></button></template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { persistLanguage } from '@/languages/language';
// Two languages, so one button that offers the other one. It names the target in its own
// script, which is how a visitor who cannot read the current language can still find it.
const { locale } = useI18n();
const toZh = computed(() => locale.value !== 'zh');
const targetTag = computed(() => toZh.value ? 'zh-CN' : 'en');
const full = computed(() => toZh.value ? '简体中文' : 'English');
const short = computed(() => toZh.value ? '中文' : 'EN');
const label = computed(() => toZh.value ? '切换到简体中文 (Switch to Chinese)' : 'Switch to English (切换到英文)');
function toggle() {
  const next = toZh.value ? 'zh' : 'en';
  locale.value = next;
  persistLanguage(next);
}
</script>
<style scoped>
.language-control{flex-shrink:0;font:inherit;font-size:12px;border:1px solid var(--market-border);border-radius:999px;background:var(--market-surface-soft);color:var(--market-text);padding:8px 14px;cursor:pointer;white-space:nowrap}.language-control:hover{border-color:var(--nc-accent)}.language-control:focus-visible{outline:2px solid var(--nc-accent);outline-offset:2px}.short{display:none}@media(max-width:500px){.language-control{font-size:11px;padding:7px 10px}.full{display:none}.short{display:inline}}
</style>
