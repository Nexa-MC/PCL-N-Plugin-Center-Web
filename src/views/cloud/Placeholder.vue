<template>
  <section class="placeholder-view" :aria-labelledby="`placeholder-${eyebrow}`">
    <p class="eyebrow">{{ $ui(eyebrow) }}</p><h1 :id="`placeholder-${eyebrow}`">{{ $ui(title) }}</h1>
    <p v-if="description" class="hero-description">{{ $ui(description) }}</p>
  </section>
</template>
<script setup lang="ts">
defineProps<{ title: string; eyebrow: string; description: string }>();
</script>
