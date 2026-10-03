<template>
  <footer class="site-footer">
    <div class="footer-brand">
      <img src="/pcln.png" alt="" />
      <div>
        <strong>PCL N</strong>
        <span>{{ t("site.footer.tagline") }}</span>
      </div>
    </div>
    <nav :aria-label="t('site.footer.navigation')">
      <router-link to="/download">{{ t("market.header.download") }}</router-link>
      <router-link to="/market">{{ t("market.header.plugins") }}</router-link>
      <a href="https://docs.pcln.top/" target="_blank" rel="noreferrer">{{ t("market.header.docs") }}</a>
      <a href="https://github.com/PCL-N-Edition/PCL-N" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
    <p>© {{ year }} {{ $ui("PCL N 贡献者 · Apache-2.0") }}</p>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<style scoped lang="scss">
.site-footer {
  width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding: 34px 0 40px;
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 18px 32px;
  border-top: 1px solid var(--market-border); color: var(--market-muted);
}
.footer-brand { display: flex; align-items: center; gap: 11px; color: var(--market-text); }
.footer-brand img { width: 34px; height: 34px; border-radius: 10px; }
.footer-brand div { display: grid; gap: 2px; }
.footer-brand strong { font-size: 14px; }
.footer-brand span { color: var(--market-muted); font-size: 11px; }
nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px 18px; }
nav a { color: var(--market-muted); font-size: 12px; }
nav a:hover { color: var(--market-accent); }
p { grid-column: 1 / -1; margin: 0; font-size: 10px; }
@media (max-width: 680px) {
  .site-footer { width: min(100% - 28px, 1180px); grid-template-columns: 1fr; }
  nav { justify-content: flex-start; }
}
</style>
