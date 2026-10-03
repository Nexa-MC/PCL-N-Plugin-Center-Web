<template><label class="theme-control"><span class="sr-only">{{ $ui("界面主题") }}</span><select :value="themePreference" :aria-label="$ui('界面主题')" @change="change"><option value="system">{{ $ui("跟随系统") }}</option><option value="light">{{ $ui("浅色") }}</option><option value="dark">{{ $ui("暗色") }}</option></select></label></template>
<script setup lang="ts">
import { themePreference, setTheme, type ThemePreference } from '@/utils/theme';
function change(event: Event) { setTheme((event.target as HTMLSelectElement).value as ThemePreference); }
</script>
<style scoped>
.theme-control{flex-shrink:0}.theme-control select{font:inherit;font-size:12px;border:1px solid var(--market-border);border-radius:999px;background:var(--market-surface-soft);color:var(--market-text);padding:8px 12px;cursor:pointer;max-width:112px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}@media(max-width:500px){.theme-control select{font-size:11px;padding:7px 8px;max-width:100px}}
</style>
