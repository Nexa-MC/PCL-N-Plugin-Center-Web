<template>
  <header class="market-header">
    <div class="market-header-inner">
      <router-link class="brand" to="/"><strong>NexaCL</strong></router-link>
      <nav aria-label="导航"><router-link to="/">主页</router-link><router-link to="/download">下载</router-link><router-link to="/store">商店</router-link><router-link to="/docs">文档</router-link></nav>
      <ThemeControl />
    </div>
  </header>
</template>
<script setup lang="ts">import ThemeControl from '@/components/ThemeControl.vue';</script>
<style scoped>
.market-header{width:100%;border-bottom:1px solid var(--market-border);background:var(--market-surface)}
.market-header-inner{width:min(1200px,calc(100% - 48px));min-height:72px;margin:0 auto;padding:16px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand,nav{display:flex;gap:24px;align-items:center}.brand{gap:10px}.brand strong{white-space:nowrap}nav{font-size:13px;flex-wrap:wrap}
@media(max-width:600px){.market-header-inner{width:calc(100% - 28px);flex-wrap:wrap;gap:8px}nav{gap:18px;font-size:12px}}
</style>
