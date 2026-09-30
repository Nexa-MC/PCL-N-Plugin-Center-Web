<template>
  <main id="main-content" class="download-main">
    <section class="page-intro"><span class="eyebrow">NexaCL / PCL N</span><h1>{{ en ? 'Choose your download.' : '下载，按你的需要。' }}</h1><p>{{ en ? 'Explore NexaCL 2.0 Alpha, or continue with PCL N 1.x.' : '体验 NexaCL 2.0 Alpha，或继续使用 PCL N 1.x。' }}</p></section>
    <ProductSwitch v-model="product" :label="en ? 'Product version' : '产品版本'" />
    <div class="product-panel">
    <LegacyDownloads v-show="product === 'legacy'" />
    <section v-show="product === 'nexa'" class="download-picker">
      <div class="release-line"><div><strong>NexaCL</strong><span v-if="selectedRelease">{{ selectedRelease.tag_name.replace(/^v/, '') }}</span><span v-else>2.0.0 Alpha</span></div><router-link to="/changelog">{{ en ? 'Release notes' : '更新日志' }} ›</router-link></div>
      <p class="alpha-advice">{{ en ? 'Alpha is an early test release. Some features are not yet available. Back up your game data before trying it.' : 'Alpha 为早期测试版本，部分功能尚未迁移。体验前，请备份游戏数据。' }}</p>
      <div class="platform-tabs" role="tablist" :aria-label="en ? 'Operating system' : '操作系统'">
        <button v-for="(item, index) in platforms" :id="`platform-${item.id}`" :key="item.id" role="tab" :aria-selected="platform === item.id" :tabindex="platform === item.id ? 0 : -1" aria-controls="platform-panel" @click="setPlatform(item.id)" @keydown="platformKey($event,index)"><KoiIcon :name="item.icon" />{{ item.name }}</button>
      </div>
      <div id="platform-panel" role="tabpanel" :aria-labelledby="`platform-${platform}`" tabindex="0">
        <div class="download-options"><label>{{ en ? 'Processor' : '处理器架构' }}<select v-model="architecture"><option value="x64">{{ platform === 'osx' ? 'Intel' : 'Intel / AMD · x64' }}</option><option value="arm64">{{ platform === 'osx' ? 'Apple Silicon' : 'ARM64' }}</option></select></label><label v-if="releases.length > 1">{{ en ? 'Version' : '版本' }}<select v-model="releaseTag"><option v-for="release in releases" :key="release.tag_name" :value="release.tag_name">{{ release.tag_name.replace(/^v/,'') }}</option></select></label></div>
        <p v-if="loading" class="download-state" role="status">{{ en ? 'Loading available downloads…' : '正在读取可用下载…' }}</p>
        <div v-else-if="failed" class="download-state" role="status"><p>{{ en ? 'Downloads could not be loaded. You can still download directly on GitHub.' : '暂时无法读取下载列表。你仍可直接前往 GitHub 下载。' }}</p><button class="retry" @click="refresh">{{ en ? 'Try again' : '重新读取' }}</button></div>
        <div v-else-if="!assets.length" class="download-state" role="status">{{ en ? 'No package is available for this selection. Check GitHub for the latest release.' : '此选项暂无可用安装包，请在 GitHub 查看最新发布。' }}</div>
        <div v-else class="package-list"><article v-for="(asset,index) in assets" :key="asset.name"><div class="package-icon" aria-hidden="true">{{ asset.name.includes('portable') ? '▣' : '↓' }}</div><div class="package-info"><h2>{{ packageLabel(asset.name) }} <span v-if="index === 0" class="package-recommend">{{ en ? 'Recommended' : '推荐' }}</span></h2><p>{{ packageDescription(asset.name) }}</p><small>{{ (asset.size / 1024 / 1024).toFixed(1) }} MB · {{ architecture === 'arm64' ? 'ARM64' : 'x64' }}</small></div><a class="package-download" :class="{ pill: index === 0 }" :href="asset.browser_download_url" :aria-label="`${en ? 'Download' : '下载'} ${packageLabel(asset.name)} ${architecture}`">{{ en ? 'Download' : '下载' }} <span aria-hidden="true">↓</span></a></article></div>
      </div>
      <p v-if="snapshot" class="alpha-advice" role="status">{{ en ? 'GitHub is currently unavailable. Showing the saved release catalog.' : '暂时无法连接 GitHub，当前显示已保存的发布信息。' }}</p>
      <div class="download-meta"><a :href="selectedRelease?.html_url || NEXA_GITHUB + '/releases'" target="_blank" rel="noreferrer">{{ en ? 'Download on GitHub' : '在 GitHub 直接下载' }} ↗</a><a v-if="checksums" :href="checksums.browser_download_url">{{ en ? 'SHA256 checksums' : 'SHA256 校验文件' }} ↓</a><span>{{ en ? 'No sign-in required' : '无需登录' }}</span></div>
    </section>
    </div>
    <section class="download-help"><div><h2>{{ en ? 'Before you start.' : '开始之前。' }}</h2><p>{{ en ? 'Installers guide you through setup. Portable archives can be extracted and opened directly.' : '安装包会引导你完成安装。便携包解压后即可打开，无需安装。' }}</p></div><div class="help-list"><details><summary>{{ en ? 'Which architecture should I choose?' : '如何选择处理器架构？' }}</summary><p>{{ en ? 'Choose x64 for Intel or AMD computers, ARM64 for Windows on ARM or ARM Linux, and Apple Silicon for M-series Macs. On macOS, check About This Mac.' : 'Intel、AMD 电脑通常选择 x64；Windows on ARM 和 ARM Linux 选择 ARM64；搭载 M 系列芯片的 Mac 选择 Apple Silicon。Mac 可在“关于本机”中确认。' }}</p></details><details><summary>{{ en ? 'What is included in the Alpha?' : 'Alpha 版目前适合怎样使用？' }}</summary><p>{{ en ? 'Try profile and installed-version switching, and game launching. Some pages are still awaiting migration. Keep your current launcher and back up saves before testing.' : '可以体验档案切换、已安装版本选择和游戏启动。部分页面仍待迁移，建议保留原启动器，并在测试前备份存档。' }}</p></details><details><summary>{{ en ? 'Need PCL N 1.x?' : '需要原来的 PCL N 1.x？' }}</summary><p>{{ en ? 'Select PCL N 1.x above to find its channels, versions and package options.' : '在页面上方选择 PCL N 1.x，即可选择原有通道、历史版本和安装选项。' }} <router-link to="/download?product=legacy">{{ en ? 'Go to 1.x downloads' : '前往 1.x 下载' }} ›</router-link></p></details></div></section>
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProductSwitch from '@/components/market/ProductSwitch.vue';
import KoiIcon from '@/components/KoiIcon.vue';
import LegacyDownloads from '@/components/market/LegacyDownloads.vue';
import { useI18n } from 'vue-i18n';
import { NEXA_GITHUB, loadNexaCatalog, releaseAssets, type NexaRelease } from '@/utils/nexaReleases';
import { watchReleaseUpdates } from '@/utils/githubReleases';
import { applyPageSeo } from '@/utils/seo';
const { locale } = useI18n(); const en = computed(() => locale.value !== 'zh');
const route = useRoute(); const router = useRouter();
const product = computed({ get: () => route.query.product === 'legacy' ? 'legacy' : 'nexa', set: (value: string) => { void router.replace({query:{...route.query, product: value === 'legacy' ? 'legacy' : undefined}}); } });
const platforms = [{id:'win',name:'Windows',icon:'grid-equal'},{id:'osx',name:'macOS',icon:'monitor'},{id:'linux',name:'Linux',icon:'console'}];
const platform = ref('win'); const architecture = ref('x64');
const releases = ref<NexaRelease[]>([]); const releaseTag = ref(''); const loading = ref(true); const failed = ref(false);
let controller: AbortController | undefined;
let stopUpdates: (() => void) | undefined;
let refreshing = false;
const snapshot = ref(false);
const selectedRelease = computed(() => releases.value.find(r=>r.tag_name===releaseTag.value));
const assets = computed(() => selectedRelease.value ? releaseAssets(selectedRelease.value,platform.value,architecture.value) : []);
const checksums = computed(() => selectedRelease.value?.assets.find(a=>a.name==='SHA256SUMS' && a.browser_download_url.startsWith(NEXA_GITHUB+'/releases/download/')));
function setPlatform(value: string) { platform.value=value; architecture.value=value==='osx'?'arm64':'x64'; }
function platformKey(event: KeyboardEvent,index: number) { let next=index; if(event.key==='ArrowRight') next=(index+1)%3; else if(event.key==='ArrowLeft') next=(index+2)%3; else if(event.key==='Home') next=0; else if(event.key==='End') next=2; else return; event.preventDefault(); setPlatform(platforms[next].id); document.getElementById(`platform-${platforms[next].id}`)?.focus(); }
function packageLabel(name: string) { if(name.includes('.portable.')) return en.value?'Portable archive':'便携包'; if(name.endsWith('.setup.exe')) return en.value?'Windows installer':'Windows 安装包'; if(name.endsWith('.msi')) return en.value?'MSI installer':'MSI 安装包'; if(name.endsWith('.dmg')) return en.value?'macOS installer':'macOS 安装包'; if(name.endsWith('.deb')) return 'DEB · Debian / Ubuntu'; if(name.endsWith('.rpm')) return 'RPM · Fedora / openSUSE'; return 'AppImage'; }
function packageDescription(name: string) { if(name.includes('.portable.')) return en.value?'Extract and open. No installation needed.':'解压后打开，无需安装。'; if(name.endsWith('.setup.exe')) return en.value?'Guided setup, with an optional desktop shortcut.':'引导式安装，可选创建桌面快捷方式。'; if(name.endsWith('.dmg')) return en.value?'Open the disk image and follow its installation instructions.':'打开镜像，按其中的说明完成安装。'; if(name.endsWith('.AppImage')) return en.value?'Allow execution, then open directly.':'赋予执行权限后直接运行。'; return en.value?'Install using your system package manager.':'通过系统安装程序完成安装。'; }
async function refresh() {
  if (refreshing) return;
  refreshing = true; const request = new AbortController(); controller = request;
  if (!releases.value.length) loading.value = true;
  try {
    const catalog = await loadNexaCatalog(request.signal);
    if (request.signal.aborted) return;
    const wasLatest = !releaseTag.value || releaseTag.value === releases.value[0]?.tag_name;
    if (catalog.source === "github" || !releases.value.length) releases.value = catalog.releases; snapshot.value = catalog.source === 'snapshot'; failed.value = false;
    if (wasLatest || !releases.value.some(r => r.tag_name === releaseTag.value)) releaseTag.value = releases.value[0]?.tag_name || '';
  } catch { if (!request.signal.aborted) failed.value = !releases.value.length; }
  finally { refreshing = false; if (!request.signal.aborted) loading.value = false; }
}
onMounted(()=>{ if(/Mac/i.test(navigator.platform)) setPlatform('osx'); else if(/Linux/i.test(navigator.platform) && !/Android/i.test(navigator.userAgent)) setPlatform('linux'); void refresh(); stopUpdates = watchReleaseUpdates(() => { void refresh(); }); });
onBeforeUnmount(()=>{ stopUpdates?.(); controller?.abort(); });
watchEffect(()=>applyPageSeo({title:en.value?'Download NexaCL 2.0.0 Alpha':'下载 NexaCL 2.0.0 Alpha',description:en.value?'Download Windows, macOS and Linux installers and portable archives directly from GitHub. PCL N 1.x remains available.':'直接从 GitHub 下载 NexaCL 的 Windows、macOS、Linux 安装包与便携包。保留 PCL N 1.x 下载。',path:'/download'}));
</script>
<style scoped>
.download-picker{background:var(--market-surface);border:1px solid var(--market-border);border-radius:26px;padding:36px 42px;max-width:920px;margin:auto}.release-line{display:flex;justify-content:space-between;gap:16px;align-items:center}.release-line>div{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}.release-line strong{font-size:23px}.release-line span{font-size:14px;color:var(--market-muted)}.release-line>a{font-size:14px;white-space:nowrap}.alpha-advice{font-size:14px;color:var(--market-muted);margin:15px 0 28px;max-width:680px}.platform-tabs{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--market-border);gap:24px}.platform-tabs button{border:0;border-bottom:2px solid transparent;background:transparent;padding:18px 8px;color:var(--market-muted);font-size:19px;display:flex;justify-content:center;align-items:center;gap:12px}.platform-tabs button[aria-selected=true]{border-color:var(--market-accent);color:var(--market-accent)}.platform-tabs button>span{font-size:24px}.download-options{display:flex;gap:24px;flex-wrap:wrap;margin:30px 0 14px}.download-options label{display:flex;align-items:center;gap:12px;color:var(--market-muted);font-size:14px}.download-options select{border:1px solid var(--market-border);background:var(--market-bg);color:var(--market-text);border-radius:9px;padding:9px 32px 9px 12px;max-width:230px}.package-list article{display:flex;align-items:center;gap:20px;padding:24px 0;border-bottom:1px solid var(--market-border)}.package-list article:last-child{border-bottom:0}.package-icon{width:44px;height:48px;display:grid;place-items:center;background:var(--market-surface-soft);border-radius:10px;color:var(--market-accent);font-size:24px;flex-shrink:0}.package-info{flex:1}.package-info h2{font-size:18px;letter-spacing:-.015em;line-height:1.5}.package-info p{font-size:14px;color:var(--market-muted);margin-top:5px}.package-info small{font-size:12px;color:var(--market-muted)}.package-recommend{display:inline-block;color:var(--market-accent);font-size:12px;font-weight:400;margin-left:8px}.package-download{font-size:15px;white-space:nowrap;padding:9px 20px;display:flex;gap:10px;align-items:center}.download-meta{border-top:1px solid var(--market-border);padding-top:22px;margin-top:12px;display:flex;flex-wrap:wrap;gap:12px 24px;font-size:14px}.download-meta>span{margin-left:auto;color:var(--market-muted)}.download-state{padding:45px 0;color:var(--market-muted)}.retry{margin-top:16px;background:transparent;color:var(--market-accent);border:0}.download-help{display:grid;grid-template-columns:1fr 1.25fr;gap:70px;padding:75px 0 90px}.download-help h2{font-size:32px}.download-help p{color:var(--market-muted);margin-top:18px}.help-list details{border-bottom:1px solid var(--market-border);padding:17px 0}.help-list details:first-child{padding-top:0}.help-list summary{cursor:pointer;font-weight:550}.help-list p{font-size:15px;padding-bottom:10px}
@media(max-width:700px){.download-picker{padding:24px 20px;border-radius:20px}.product-switch>span,.product-switch>a{padding:9px 13px;font-size:14px}.platform-tabs{gap:8px}.platform-tabs button{font-size:16px;gap:6px;padding:12px 3px}.platform-tabs button>span{font-size:20px}.release-line{align-items:flex-start}.release-line>div{gap:0;flex-direction:column}.release-line strong{font-size:20px}.package-list article{gap:12px;flex-wrap:wrap}.package-icon{display:none}.package-info{min-width:170px}.package-download{padding:8px 14px}.package-info h2{font-size:16px}.download-meta>span{margin-left:0}.download-help{grid-template-columns:1fr;gap:24px;padding:50px 0}.download-options label{flex-wrap:wrap}.download-options select{max-width:100%}}
</style>
