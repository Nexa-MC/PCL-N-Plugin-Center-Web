<template>
  <div class="nexa-site">
    <a class="skip-content" href="#main-content">{{ en ? 'Skip to content' : '跳至内容' }}</a>
    <MarketHeader />
    <slot />
    <footer class="nexa-footer wrap">
      <div><strong>NexaCL</strong><p>{{ en ? 'Minecraft launcher. Built by the community.' : '由社区开发的 Minecraft 启动器。' }}</p></div>
      <nav aria-label="Footer"><router-link to="/download">{{ en ? 'Download' : '下载' }}</router-link><router-link to="/changelog">{{ en ? 'Changelog' : '更新日志' }}</router-link><router-link to="/legal">{{ en ? 'Terms' : '服务条款' }}</router-link><router-link to="/legal/privacy">{{ en ? 'Privacy' : '隐私政策' }}</router-link><router-link to="/download?product=legacy">PCL N 1.x</router-link><a :href="NEXA_GITHUB" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
      <p class="footnote">© {{ new Date().getFullYear() }} PCL N contributors. Apache-2.0.<br>{{ en ? 'Not affiliated with Mojang or Microsoft.' : '本项目与 Mojang 或 Microsoft 无隶属关系。' }}</p>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MarketHeader from './MarketHeader.vue';
import { NEXA_GITHUB } from '@/utils/nexaReleases';
import '@/styles/nexa.scss';
const { locale } = useI18n();
const en = computed(() => locale.value !== 'zh');
</script>
