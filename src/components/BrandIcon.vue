<template>
  <img class="nexa-brand-icon" :src="dark || isDark ? '/icons/nexacl-dark-128.png' : '/icons/nexacl-128.png'" alt="" width="32" height="32" aria-hidden="true" />
</template>
<script setup lang="ts">
import { isDark } from '@/utils/theme';
defineProps<{ dark?: boolean }>();
</script>
<style scoped>
.nexa-brand-icon { display: block; width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
</style>
