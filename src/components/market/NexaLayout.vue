<template>
  <div class="nexa-site">
    <a class="skip-content" href="#main-content">{{ en ? 'Skip to content' : $ui("跳至内容") }}</a>
    <MarketHeader />
    <slot />
    <footer class="nexa-footer wrap">
      <div><strong>NexaCL</strong><p>{{ en ? 'Minecraft launcher. Built by the community.' : $ui("由社区开发的 Minecraft 启动器。") }}</p></div>
      <nav aria-label="Footer"><router-link to="/download">{{ en ? 'Download' : $ui("下载") }}</router-link><router-link to="/changelog">{{ en ? 'Changelog' : $ui("更新日志") }}</router-link><router-link to="/legal">{{ en ? 'Terms' : $ui("服务条款") }}</router-link><router-link to="/legal/privacy">{{ en ? 'Privacy' : $ui("隐私政策") }}</router-link><router-link to="/download?product=legacy">PCL N 1.x</router-link><a :href="NEXA_GITHUB" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
      <p class="footnote">© {{ new Date().getFullYear() }} {{ $ui("PCL N 贡献者。Apache-2.0。") }}<br>{{ en ? 'Not affiliated with Mojang or Microsoft.' : $ui("本项目与 Mojang 或 Microsoft 无隶属关系。") }}</p>
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
