<template><main class="not-found"><BrandIcon class="not-found-brand" /><p class="eyebrow">404 / NEXA CLOUD</p><h1>{{ $ui("这里还没有故事。") }}</h1><p>{{ $ui("链接可能已失效，或属于已下线的旧服务。") }}</p><router-link class="primary-button" to="/store">{{ $ui("返回 NexaStore →") }}</router-link></main></template>

<script setup lang="ts">
import BrandIcon from '@/components/BrandIcon.vue';
</script>
