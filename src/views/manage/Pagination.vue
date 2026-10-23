<template>
  <nav v-if="total > 0" class="manage-pagination" :aria-label='$ui("分页")'>
    <span>{{ $ui('第 {0}–{1} 条，共 {2} 条', [formatNumber(offset + 1), formatNumber(Math.min(offset + 25, total)), formatNumber(total)]) }}</span>
    <div><button class="secondary-button" :disabled="busy || offset === 0" @click="$emit('change', Math.max(0, offset - 25))">{{ $ui("上一页") }}</button><button class="secondary-button" :disabled="busy || offset + 25 >= total" @click="$emit('change', offset + 25)">{{ $ui("下一页") }}</button></div>
  </nav>
</template>
<script setup lang="ts">
import { formatNumber } from './useManagement';
defineProps<{ offset: number; total: number; busy: boolean }>();
defineEmits<{ change: [offset: number] }>();
</script>
