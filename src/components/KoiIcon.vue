<template>
  <span class="koi-icon" aria-hidden="true" v-html="markup"></span>
</template>
<script setup lang="ts">
// 统一图标组件：复用仓库内置的 KOI SVG 图标库（src/assets/icons/koi-*.svg，免费商用），
// 通过 currentColor 随文本颜色着色，尺寸跟随 font-size（svg 固定 1em）。
import { computed } from 'vue';

const modules = import.meta.glob('@/assets/icons/koi-*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const icons: Record<string, string> = {};
for (const [key, raw] of Object.entries(modules)) {
  const match = key.match(/koi-([a-z0-9-]+)\.svg$/);
  if (match) icons[match[1]] = raw;
}
const props = defineProps<{ name: string }>();
const markup = computed(() => icons[props.name] ?? '');
</script>
<style scoped>
.koi-icon{display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;vertical-align:middle}
.koi-icon :deep(svg){width:1em;height:1em;display:block}
.koi-icon :deep(svg path),.koi-icon :deep(svg circle),.koi-icon :deep(svg rect),.koi-icon :deep(svg line),.koi-icon :deep(svg polyline){stroke:currentColor;fill:none}
</style>
