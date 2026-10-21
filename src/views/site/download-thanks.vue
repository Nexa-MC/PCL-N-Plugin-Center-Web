<template>
  <main class="thanks-page">
    <MarketHeader />
    <section class="thanks-shell">
      <div class="thanks-card">
        <span class="eyebrow">{{ t("site.download.thanks.eyebrow") }}</span>
        <h1>{{ t("site.download.thanks.title") }}</h1>
        <p class="lede">{{ t("site.download.thanks.subtitle") }}</p>

        <div class="status" :data-state="status">
          <span class="dot" aria-hidden="true" />
          <p>{{ statusText }}</p>
        </div>

        <div class="actions">
          <a v-if="downloadUrl" class="primary" :href="downloadUrl" rel="noreferrer" @click="manualDownload">
            {{ t("site.download.thanks.manualLink") }}
            <span v-if="assetName" class="asset">{{ assetName }}</span>
          </a>
          <a v-if="signatureUrl" class="secondary" :href="signatureUrl" target="_blank" rel="noreferrer">
            {{ t("site.download.signature") }} ↗
          </a>
        </div>

        <p class="hint">{{ t("site.download.thanks.hint") }}</p>
        <div v-if="isAppImage" class="appimage-hint">
          <span aria-hidden="true">i</span>
          <div>
            <p>{{ appImageHintText }}</p>
            <code v-if="assetName">chmod +x {{ assetName }} && ./{{ assetName }}</code>
          </div>
        </div>

        <div class="footer-nav">
          <router-link to="/download">{{ t("site.download.thanks.back") }}</router-link>
          <a :href="RELEASE_GITHUB + '/releases'" target="_blank" rel="noreferrer">
            {{ t("site.download.thanks.allReleases") }} ↗
          </a>
        </div>
      </div>
    </section>
    <PublicSiteFooter />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import MarketHeader from "@/components/market/MarketHeader.vue";
import PublicSiteFooter from "@/components/market/PublicSiteFooter.vue";
import { releaseAssetIdentity, releaseSignatureUrl, RELEASE_GITHUB } from "@/utils/releaseRepository";
import { applyPageSeo } from "@/utils/seo";

const { t, locale } = useI18n();
const route = useRoute();

const status = ref<"starting" | "started" | "blocked">("starting");

const downloadAsset = computed(() => releaseAssetIdentity(String(route.query.url ?? "")));
const downloadUrl = computed(() => downloadAsset.value?.url || "");
const assetName = computed(() => downloadAsset.value?.name || "");
const signatureUrl = computed(() => releaseSignatureUrl(downloadUrl.value, String(route.query.sig ?? "")));

const isAppImage = computed(
  () => assetName.value.toLowerCase().endsWith(".appimage") || downloadUrl.value.toLowerCase().includes(".appimage")
);
const appImageHintText = computed(() =>
  t("site.download.thanks.appImageChmod", { name: assetName.value || "Nexa-….AppImage" })
);

const statusText = computed(() => {
  if (!downloadUrl.value) return t("site.download.thanks.invalid");
  if (status.value === "starting") return t("site.download.thanks.starting");
  if (status.value === "blocked") return t("site.download.thanks.blocked");
  return t("site.download.thanks.started");
});

const triggerDownload = () => {
  if (!downloadUrl.value) {
    status.value = "blocked";
    return;
  }
  try {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl.value;
    anchor.rel = "noreferrer";
    anchor.style.display = "none";
    // download attribute is ignored cross-origin, but click still starts navigation/download.
    if (assetName.value) anchor.setAttribute("download", assetName.value);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    status.value = "started";
    // If the browser blocked the automatic download, the manual link remains visible.
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        // Keep "started" — user may still use the manual link below.
      }
    }, 1500);
  } catch {
    status.value = "blocked";
  }
};

const manualDownload = () => {
  status.value = "started";
};

onMounted(() => {
  // Defer one frame so the page paints before navigation/download starts.
  requestAnimationFrame(() => triggerDownload());
});

watchEffect(() => {
  applyPageSeo({
    title: t("site.download.thanks.pageTitle"),
    description: t("site.download.thanks.subtitle"),
    path: "/download/thanks"
  });
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en-US";
});
</script>

<style scoped lang="scss">
.thanks-page {
  --market-bg: #f5f7fb;
  --market-surface: rgba(255, 255, 255, 0.92);
  --market-border: rgba(45, 56, 91, 0.12);
  --market-text: #192034;
  --market-muted: #677087;
  --market-accent: #568ee8;
  --market-accent-soft: rgba(86, 142, 232, 0.12);
  min-height: 100vh;
  color: var(--market-text);
  background:
    radial-gradient(circle at 75% 0, rgba(75, 139, 224, 0.16), transparent 30rem),
    var(--market-bg);
}
:global(html.dark .thanks-page) {
  --market-bg: #0d1118;
  --market-surface: rgba(26, 31, 41, 0.94);
  --market-border: rgba(218, 229, 255, 0.12);
  --market-text: #f4f7fc;
  --market-muted: #a7b0c2;
  --market-accent: #74aef4;
  --market-accent-soft: rgba(116, 174, 244, 0.14);
  background:
    radial-gradient(circle at 75% 0, rgba(61, 121, 204, 0.2), transparent 30rem),
    var(--market-bg);
}
.thanks-page :deep(.market-header) {
  width: 100%;
}
.thanks-shell {
  width: min(720px, calc(100% - 40px));
  margin: 0 auto;
  padding: 88px 0 96px;
}
.thanks-card {
  padding: 40px 36px;
  border: 1px solid var(--market-border);
  border-radius: 22px;
  background: var(--market-surface);
  box-shadow: 0 22px 60px rgba(34, 45, 79, 0.08);
  text-align: center;
}
.eyebrow {
  color: var(--market-accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h1 {
  margin: 14px 0 12px;
  font-size: clamp(32px, 5vw, 44px);
  letter-spacing: -0.04em;
}
.lede {
  margin: 0 auto;
  max-width: 34rem;
  color: var(--market-muted);
  font-size: 15px;
  line-height: 1.7;
}
.status {
  margin: 28px auto 0;
  padding: 14px 16px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  background: var(--market-accent-soft);
  color: var(--market-text);
  font-size: 13px;
  font-weight: 650;
}
.status .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--market-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--market-accent) 25%, transparent);
}
.status[data-state="blocked"] {
  background: rgba(220, 80, 80, 0.12);
}
.status[data-state="blocked"] .dot {
  background: #d85a5a;
  box-shadow: none;
}
.status p {
  margin: 0;
}
.actions {
  margin-top: 28px;
  display: grid;
  gap: 12px;
  justify-items: center;
}
.primary {
  min-height: 48px;
  padding: 0 22px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 12px;
  color: #fff;
  background: var(--market-accent);
  font-size: 14px;
  font-weight: 760;
  text-decoration: none;
}
.primary .asset {
  max-width: min(70vw, 420px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.88;
  font-size: 11px;
  font-weight: 550;
}
.secondary {
  color: var(--market-accent);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}
.hint {
  margin: 22px auto 0;
  max-width: 32rem;
  color: var(--market-muted);
  font-size: 12px;
  line-height: 1.65;
}
.appimage-hint {
  margin: 18px auto 0;
  max-width: 36rem;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  text-align: left;
  border-radius: 12px;
  background: var(--market-surface-soft, rgba(77, 91, 132, 0.07));
  color: var(--market-muted);
  font-size: 12px;
  line-height: 1.6;
}
.appimage-hint span {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--market-accent, #568ee8);
  background: var(--market-accent-soft, rgba(86, 142, 232, 0.12));
  font-weight: 800;
}
.appimage-hint p {
  margin: 0 0 8px;
}
.appimage-hint code {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 11px;
  word-break: break-all;
}
.footer-nav {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  gap: 22px;
  flex-wrap: wrap;
}
.footer-nav a {
  color: var(--market-muted);
  font-size: 12px;
  font-weight: 650;
  text-decoration: none;
}
.footer-nav a:hover {
  color: var(--market-accent);
}
@media (max-width: 520px) {
  .thanks-shell {
    width: min(100% - 28px, 720px);
    padding-top: 64px;
  }
  .thanks-card {
    padding: 28px 20px;
  }
}
</style>
