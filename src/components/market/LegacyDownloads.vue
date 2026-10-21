<template>
  <section class="legacy-picker">
    <header><div><h2>PCL N 1.x</h2><p>{{ t('site.download.versionHistoryHint') }}</p></div><a :href="LEGACY_GITHUB + '/releases'" target="_blank" rel="noreferrer">GitHub ↗</a></header>
    <div class="legacy-platforms" :aria-label="t('site.download.platformLabel')">
      <button v-for="item in platforms" :key="item.id" :aria-pressed="selectedPlatformId === item.id" @click="openDownload(item.id)">{{ item.name }}</button>
    </div>
    <p v-if="catalogLoading" role="status">{{ t('site.download.catalogLoading') }}</p>
    <fieldset :disabled="catalogLoading">
      <legend>{{ t('site.download.channel') }}</legend>
      <div class="legacy-channels"><button v-for="ch in channels" :key="ch.id" :disabled="!channelHasVersions(ch.id)" :aria-pressed="ch.id === selectedChannel" @click="selectChannel(ch.id)"><strong>{{ ch.label }}</strong><small>{{ channelLatestLabel(ch.id) }}</small></button></div>
      <div class="legacy-options">
        <label>{{ t('site.download.version') }}<select v-model="selectedVersionId"><option v-for="version in channelVersions" :key="version.id" :value="version.id">{{ version.label }}</option></select></label>
        <label>{{ t('site.download.architecture') }}<select v-model="selectedArch"><option v-for="arch in selectedPlatform.architectures" :key="arch.id" :value="arch.id">{{ arch.label }}</option></select></label>
        <label>{{ t('site.download.packageKind') }}<select v-model="packageKind"><option v-for="kind in packageKinds" :key="kind.id" :value="kind.id">{{ kind.label }}</option></select></label>
      </div>
      <label class="check-option"><input v-model="includeRuntime" type="checkbox" :disabled="selectedChannel === 'ci'"/><span>{{ t('site.download.includeRuntime') }}<small>{{ t('site.download.includeRuntimeHint') }}</small></span></label>
      <label v-if="selectedVersion.supportsPluginChoice" class="check-option"><input v-model="includePlugin" type="checkbox"/><span>{{ t('site.download.includePlugin') }}</span></label>
    </fieldset>
    <p v-if="!catalogLoading && selectedVersion.packaging !== 'v2'" class="legacy-hint">{{ t('site.download.legacyNotice') }}</p>
    <p v-else-if="packageKind === 'appimage'" class="legacy-hint">{{ t('site.download.appImageHint') }}</p>
    <footer><div><strong>{{ selectedAssetLabel }}</strong><code>{{ resolved.assetName || assetFileName }}</code><a v-if="signatureUrl" :href="signatureUrl">{{ t('site.download.signature') }} ↗</a></div><button class="pill" :disabled="!canConfirmDownload" @click="goThanks">{{ t('site.download.downloadNow') }} ↓</button></footer>
  </section>
</template>
<script setup lang="ts">
import { LEGACY_GITHUB } from '@/utils/releaseRepository';
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { watchReleaseUpdates } from "@/utils/githubReleases";
import { useRouter } from "vue-router";



import {
  FALLBACK_VERSIONS,
  buildAssetFileName,
  fetchLauncherVersionsWithSource,
  latestForChannel,
  resolveDownloadUrls,
  versionsForChannel,
  type ReleaseChannel,
  type ReleaseVersion
} from "@/utils/launcherReleases";

type PlatformId = "windows" | "macos" | "linux";
/** Concrete package SKU matching published asset names. */
type PackageKindId =
  | "msi"
  | "exe-installer"
  | "dmg"
  | "deb"
  | "rpm"
  | "appimage"
  | "portable"
  | "legacy-archive";

const { t } = useI18n();
const router = useRouter();

const platforms = [
  {
    id: "windows" as const,
    icon: "⊞",
    name: "Windows",
    architectures: [
      { id: "x64", label: "x64" },
      { id: "arm64", label: "ARM64" }
    ]
  },
  {
    id: "macos" as const,
    icon: "⌘",
    name: "macOS",
    architectures: [
      { id: "arm64", label: "Apple Silicon" },
      { id: "x64", label: "Intel" }
    ]
  },
  {
    id: "linux" as const,
    icon: "◆",
    name: "Linux",
    architectures: [
      { id: "x64", label: "x64" },
      { id: "arm64", label: "ARM64" }
    ]
  }
];

const channels = computed(() => [
  { id: "release" as const, label: t("site.download.stable") },
  { id: "beta" as const, label: t("site.download.beta") },
  { id: "ci" as const, label: t("site.download.ci") }
]);

/** Empty until sync API pull finishes — avoid showing a stale baked-in list first. */
const versions = ref<ReleaseVersion[]>([]);
const catalogLoading = ref(true);
const catalogStatus = ref("");
const dialogVisible = ref(false);
const selectedPlatformId = ref<PlatformId>("windows");
const selectedChannel = ref<ReleaseChannel>("beta");
const selectedVersionId = ref("");
const selectedArch = ref("x64");
const includeRuntime = ref(true);
const includePlugin = ref(true);
const packageKind = ref<PackageKindId>("msi");

const userAgent = navigator.userAgent.toLowerCase();
const isArm =
  /arm64|aarch64/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const recommendedPlatformId = computed<PlatformId | "">(() => {
  if (userAgent.includes("windows")) return "windows";
  if (userAgent.includes("mac")) return "macos";
  if (userAgent.includes("linux")) return "linux";
  return "";
});

const selectedPlatform = computed(
  () => platforms.find(item => item.id === selectedPlatformId.value) ?? platforms[0]
);

const channelVersions = computed(() => versionsForChannel(versions.value, selectedChannel.value));

/** Safe placeholder so the dialog can open while the sync pull is still in flight. */
const PLACEHOLDER_VERSION: ReleaseVersion = {
  id: "",
  label: "…",
  tag: "",
  channel: "beta",
  packaging: "v2",
  supportsPluginChoice: false,
  packageAssets: []
};

const selectedVersion = computed(
  () =>
    channelVersions.value.find(item => item.id === selectedVersionId.value) ??
    channelVersions.value[0] ??
    versions.value[0] ??
    PLACEHOLDER_VERSION
);

const canConfirmDownload = computed(
  () => !catalogLoading.value && Boolean(selectedVersion.value.tag) && Boolean(downloadUrl.value)
);

/** Platform package menus: Win×3, macOS×1, Linux×4 (v2); legacy keeps a single archive. */
const packageKinds = computed(() => {
  if (!selectedVersion.value.tag || selectedVersion.value.packaging !== "v2") {
    return [{ id: "legacy-archive" as const, label: t("site.download.legacyArchive") }];
  }
  if (selectedPlatformId.value === "windows") {
    return [
      { id: "msi" as const, label: "MSI" },
      { id: "exe-installer" as const, label: "EXE" },
      { id: "portable" as const, label: t("site.download.portable") }
    ];
  }
  if (selectedPlatformId.value === "macos") {
    return [{ id: "dmg" as const, label: "DMG" }];
  }
  return [
    { id: "deb" as const, label: "DEB" },
    { id: "rpm" as const, label: "RPM" },
    { id: "appimage" as const, label: "AppImage" },
    { id: "portable" as const, label: t("site.download.portableTar") }
  ];
});

const runtimeId = computed(() => {
  const prefix =
    selectedPlatformId.value === "windows"
      ? "win"
      : selectedPlatformId.value === "macos"
        ? "osx"
        : "linux";
  return `${prefix}-${selectedArch.value}`;
});

const assetFileName = computed(() => {
  if (!selectedVersion.value.tag) return "";
  const kind = packageKind.value;
  if (kind === "legacy-archive" || selectedVersion.value.packaging !== "v2") {
    return buildAssetFileName({
      channel: selectedVersion.value.channel,
      runtimeId: runtimeId.value,
      includeRuntime: selectedChannel.value === "ci" ? true : includeRuntime.value,
      includePlugin: includePlugin.value,
      supportsPluginChoice: selectedVersion.value.supportsPluginChoice,
      packaging: "legacy",
      platform: selectedPlatformId.value,
      delivery: "portable",
      packageFormat: "zip"
    });
  }
  const delivery = kind === "portable" ? "portable" : "installer";
  const packageFormat =
    kind === "portable"
      ? selectedPlatformId.value === "windows"
        ? "exe"
        : "tar.gz"
      : kind === "exe-installer"
        ? "exe-installer"
        : kind;
  return buildAssetFileName({
    channel: selectedVersion.value.channel,
    runtimeId: runtimeId.value,
    includeRuntime: selectedChannel.value === "ci" ? true : includeRuntime.value,
    includePlugin: includePlugin.value,
    supportsPluginChoice: selectedVersion.value.supportsPluginChoice,
    packaging: "v2",
    platform: selectedPlatformId.value,
    delivery,
    packageFormat
  });
});

const resolved = computed(() => {
  if (!selectedVersion.value.tag || !assetFileName.value) {
    return { downloadUrl: "", signatureUrl: "", assetName: "" };
  }
  return resolveDownloadUrls(selectedVersion.value, assetFileName.value);
});
const downloadUrl = computed(() => resolved.value.downloadUrl);
const signatureUrl = computed(() => resolved.value.signatureUrl);
const selectedAssetLabel = computed(
  () => packageKinds.value.find(k => k.id === packageKind.value)?.label ?? packageKind.value
);

const channelHasVersions = (channel: ReleaseChannel) =>
  versionsForChannel(versions.value, channel).length > 0;

const channelLatestLabel = (channel: ReleaseChannel) => {
  if (catalogLoading.value) return t("site.download.catalogLoadingShort");
  const latest = latestForChannel(versions.value, channel);
  return latest?.label ?? t("site.download.channelEmpty");
};

const selectChannel = (channel: ReleaseChannel) => {
  if (!channelHasVersions(channel)) return;
  selectedChannel.value = channel;
  const list = versionsForChannel(versions.value, channel);
  selectedVersionId.value = list[0]?.id ?? selectedVersionId.value;
  if (channel === "ci") includeRuntime.value = true;
};

const syncPackageKind = () => {
  const kinds = packageKinds.value;
  if (!kinds.some(k => k.id === packageKind.value)) {
    packageKind.value = kinds[0]?.id ?? "legacy-archive";
  }
};

const openDownload = (platform: PlatformId) => {
  selectedPlatformId.value = platform;
  selectedArch.value = isArm
    ? "arm64"
    : platform === "macos"
      ? "arm64"
      : "x64";
  syncPackageKind();
  dialogVisible.value = true;
};

const goThanks = () => {
  if (!canConfirmDownload.value) return;
  dialogVisible.value = false;
  router.push({
    path: "/download/thanks",
    query: {
      url: downloadUrl.value,
      sig: signatureUrl.value,
      name: resolved.value.assetName
    }
  });
};

watch([selectedVersionId, selectedPlatformId, selectedChannel], () => {
  syncPackageKind();
});

watch(selectedChannel, ch => {
  if (ch === "ci") includeRuntime.value = true;
});

let abort: AbortController | null = null;
let stopUpdates: (() => void) | undefined;
let refreshing = false;

async function refreshCatalog() {
  if (refreshing) return; refreshing = true;
  const previous = selectedVersionId.value;
  if (!abort) { catalogLoading.value = true; catalogStatus.value = t("site.download.catalogLoading"); }
  abort = new AbortController();
  try {
    const result = await fetchLauncherVersionsWithSource({ signal: abort.signal });
    if (abort.signal.aborted || result.source === "fallback" && previous) return;
    const remote = result.versions.filter(version => /^v?1\./i.test(version.tag) || version.tag === 'ci-latest');
    if (remote.length) {
      versions.value = remote;
      // Prefer beta latest (active channel); else first available.
      const prefer: ReleaseChannel[] = ["beta", "release", "ci"];
      const first = prefer.map(ch => latestForChannel(remote, ch)).find(Boolean);
      if (previous && remote.some(v => v.id === previous)) { selectedVersionId.value = previous; }
      else if (first) {
        selectedChannel.value = first.channel;
        selectedVersionId.value = first.id;
      } else {
        selectedVersionId.value = remote[0]?.id ?? "";
      }
      if (result.source === "github") {
        catalogStatus.value = t("site.download.catalogReadyApi", { count: remote.length });
      } else if (result.source === "static") {
        catalogStatus.value = t("site.download.catalogReadyStatic", { count: remote.length });
      } else {
        catalogStatus.value = t("site.download.catalogFallback");
      }
    } else {
      versions.value = FALLBACK_VERSIONS.map(v => ({ ...v }));
      selectedVersionId.value =
        FALLBACK_VERSIONS.find(v => v.channel === "beta")?.id ?? FALLBACK_VERSIONS[0]?.id ?? "";
      catalogStatus.value = t("site.download.catalogFallback");
    }
  } catch {
    if (previous || abort?.signal.aborted) return;
    versions.value = FALLBACK_VERSIONS.map(v => ({ ...v }));
    selectedVersionId.value =
      FALLBACK_VERSIONS.find(v => v.channel === "beta")?.id ?? FALLBACK_VERSIONS[0]?.id ?? "";
    catalogStatus.value = t("site.download.catalogFallback");
  } finally {
    catalogLoading.value = false; refreshing = false;
  }
}
onMounted(() => { openDownload(recommendedPlatformId.value || "windows"); void refreshCatalog(); stopUpdates = watchReleaseUpdates(() => { void refreshCatalog(); }); });
onUnmounted(() => { stopUpdates?.(); abort?.abort(); });

</script>
<style scoped>
.legacy-picker{background:var(--market-surface);border:1px solid var(--market-border);border-radius:26px;padding:36px 42px;max-width:920px;margin:auto}header,footer{display:flex;justify-content:space-between;align-items:center;gap:24px}h2{font-size:23px}header p,.legacy-hint{font-size:14px;color:var(--market-muted);margin-top:8px}header a{font-size:14px}.legacy-platforms{display:grid;grid-template-columns:repeat(3,1fr);margin:24px 0;border-bottom:1px solid var(--market-border)}.legacy-platforms button{padding:18px 4px;border:0;border-bottom:2px solid transparent;background:none;font-size:19px;color:var(--market-muted)}.legacy-platforms button[aria-pressed=true]{border-color:var(--market-accent);color:var(--market-accent)}fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-size:14px;margin-bottom:12px}.legacy-channels{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.legacy-channels button{border:1px solid var(--market-border);border-radius:14px;background:var(--market-bg);color:var(--market-text);padding:16px;text-align:left}.legacy-channels button[aria-pressed=true]{border-color:var(--market-accent);box-shadow:inset 0 0 0 1px var(--market-accent)}small{display:block;font-size:12px;color:var(--market-muted);margin-top:5px}.legacy-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:26px 0}.legacy-options label{font-size:14px;color:var(--market-muted)}select{display:block;width:100%;margin-top:10px;padding:12px;border:1px solid var(--market-border);border-radius:10px;background:var(--market-bg);color:var(--market-text);font:inherit}.check-option{display:flex;align-items:center;gap:12px;padding:14px 0;font-size:15px}.check-option input{width:18px;height:18px;accent-color:var(--market-accent)}footer{margin-top:28px;padding-top:24px;border-top:1px solid var(--market-border)}footer>div{min-width:0}footer code{display:block;overflow-wrap:anywhere;color:var(--market-muted);font-size:12px;margin:6px 0}footer a{font-size:13px}footer .pill{flex-shrink:0}button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){.legacy-picker{padding:24px 20px;border-radius:20px}.legacy-options{grid-template-columns:1fr;gap:16px}.legacy-platforms button{font-size:16px}.legacy-channels button{padding:12px 8px}footer{align-items:stretch;flex-direction:column}}
</style>
