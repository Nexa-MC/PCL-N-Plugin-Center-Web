<template>
  <div class="cloud-shell">
    <a class="skip-link" href="#cloud-content">{{ en ? 'Skip to content' : $ui("跳至内容") }}</a>
    <header class="cloud-header">
      <router-link class="cloud-brand" to="/"><BrandIcon /><strong>NexaMC</strong></router-link>
      <nav :aria-label="en ? 'Site navigation' : $ui('平台入口')"><router-link to="/" :class="{active: route.path === '/'}">{{ en ? 'Home' : $ui("主页") }}</router-link><router-link to="/download" :class="{active: route.path.startsWith('/download')}">{{ en ? 'Download' : $ui("下载") }}</router-link><router-link to="/store" :class="{active: route.path.startsWith('/store')}">{{ en ? 'Store' : $ui("商店") }}</router-link><router-link to="/pricing" :class="{active: ['/plans', '/pricing'].includes(route.path)}">{{ $ui("套餐价格") }}</router-link><router-link to="/docs" :class="{active: route.path.startsWith('/docs')}">{{ en ? 'Docs' : $ui("文档") }}</router-link></nav>
      <div class="account-menu">
        <button class="account-status" type="button" :aria-label="accountLabel" :aria-expanded="Boolean(session && menuOpen)" aria-haspopup="menu" @click="openAccount"><span class="status-dot" aria-hidden="true"></span><span class="account-label">{{ accountLabel }}</span><KoiIcon class="account-mobile-icon" name="profile-circle" aria-hidden="true" /></button>
        <div v-if="session && menuOpen" class="account-dropdown" role="menu"><router-link role="menuitem" to="/account" @click="menuOpen = false">{{ en ? 'My account' : $ui("我的账户") }}</router-link><a v-if="session.developer || session.trustedDeveloper" role="menuitem" href="https://dev.consol.pcln.top/">{{ $ui('开发者控制台') }} ↗</a><router-link v-else role="menuitem" to="/account?section=developer" @click="menuOpen = false">{{ $ui('开发者控制台') }}</router-link><a v-if="session.creator" role="menuitem" href="https://creator.consol.pcln.top/">{{ $ui('创作者控制台') }} ↗</a><router-link v-else role="menuitem" to="/account?section=creator" @click="menuOpen = false">{{ $ui('创作者控制台') }}</router-link><a v-if="session.staff" role="menuitem" href="https://manage.pcln.top/">{{ $ui('网站管理') }} ↗</a><router-link v-else role="menuitem" to="/account?section=website" @click="menuOpen = false">{{ $ui('网站管理') }}</router-link><div class="account-divider" role="separator"></div><button type="button" role="menuitem" @click="logout">{{ en ? 'Sign out' : $ui("退出登录") }}</button></div>
      </div>
      <LanguageControl />
      <ThemeControl />
    </header>
    <div class="cloud-body">
      <main id="cloud-content" class="cloud-content"><router-view :key="route.path.startsWith('/store') ? 'store' : route.path" /></main>
    </div>
    <footer class="cloud-footer" :class="{ 'dashboard-footer': publisherConsole }">
      <div><strong>NexaMC</strong><p>{{ $ui('社区开发的 Minecraft 启动器与配套云服务。') }}</p></div>
      <nav v-if="publisherConsole" :aria-label="$ui('页脚导航')"><router-link to="/pricing">{{ $ui('套餐价格') }}</router-link><router-link to="/legal/terms">{{ $ui('服务条款') }}</router-link><router-link to="/legal/privacy">{{ $ui('隐私政策') }}</router-link><router-link to="/legal/refunds">{{ $ui('退款与取消政策') }}</router-link><router-link to="/contact">{{ $ui('联系我们') }}</router-link><a v-for="contact in CONTACTS" :key="contact.key" :href="`mailto:${contact.address}`">{{ $ui(contact.label) }}</a></nav>
      <nav v-else class="footer-sections" :aria-label="$ui('页脚导航')">
        <div><h2>{{ en ? 'Explore' : '探索产品' }}</h2><router-link to="/download">{{ $ui('下载') }}</router-link><router-link to="/store">{{ $ui('商店') }}</router-link><router-link to="/pricing">{{ $ui('套餐价格') }}</router-link><router-link to="/docs">{{ $ui('文档') }}</router-link></div>
        <div><h2>{{ en ? 'Help & community' : '帮助与社区' }}</h2><router-link to="/changelog">{{ $ui('更新日志') }}</router-link><router-link to="/contact">{{ $ui('联系我们') }}</router-link><router-link to="/feedback">{{ en ? 'Feedback' : '体验反馈' }}</router-link><a v-for="contact in CONTACTS" :key="contact.key" :href="`mailto:${contact.address}`">{{ $ui(contact.label) }}</a></div>
        <div><h2>{{ en ? 'Policies' : '条款与政策' }}</h2><router-link to="/legal/terms">{{ $ui('服务条款') }}</router-link><router-link to="/legal/privacy">{{ $ui('隐私政策') }}</router-link><router-link to="/legal/refunds">{{ $ui('退款与取消政策') }}</router-link></div>
      </nav>
    </footer>
  </div>
</template>
<script setup lang="ts">
import KoiIcon from '@/components/KoiIcon.vue';
import BrandIcon from '@/components/BrandIcon.vue';
import { CONTACTS } from '@/config/contact';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { platform, SESSION_EVENT, type Session } from '@/api/platform';
import { useI18n } from 'vue-i18n';
import LanguageControl from '@/components/LanguageControl.vue';
import ThemeControl from '@/components/ThemeControl.vue';
const route = useRoute(), router = useRouter();
const { locale } = useI18n();
const publisherConsole = computed(() => route.path.startsWith('/publisher/'));
const en = computed(() => locale.value !== 'zh');
const session = ref<Session>(), menuOpen = ref(false);
const accountLabel = computed(() => session.value ? (session.value.name || (en.value ? 'Manage account' : '账户管理')) : (en.value ? 'Sign in' : '登录 / 注册'));
async function loadSession() { try { session.value = await platform.session(); } catch { session.value = undefined; return; } if (['/plans', '/pricing'].includes(route.path) || route.path.startsWith('/legal')) return; if (session.value && session.value.setupRequired) { void router.push('/register?setup=1'); return; } if (session.value && !session.value.termsAccepted && route.path !== '/account') void router.push('/account'); }
function openAccount() { if (!session.value) { menuOpen.value = false; void router.push({ path: '/login', query: { return: route.fullPath } }); return; } menuOpen.value = !menuOpen.value; }
async function logout() { menuOpen.value = false; if (!session.value) return router.push({ path: '/login', query: { return: route.fullPath } }); await platform.logout(); session.value = undefined; await router.push({ path: '/login', query: { return: route.fullPath } }); }
const onFocus = () => void loadSession();
// Close the account dropdown when clicking anywhere outside of it.
function onDocumentClick(event: MouseEvent) {
  if (!menuOpen.value) return;
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('.account-menu')) menuOpen.value = false;
}
function onDocumentKeydown(event: KeyboardEvent) { if (event.key === 'Escape') menuOpen.value = false; }
const removeRouteListener = router.afterEach(() => { menuOpen.value = false; });
onMounted(() => { void loadSession(); window.addEventListener('focus', onFocus); window.addEventListener(SESSION_EVENT, onFocus); document.addEventListener('click', onDocumentClick); document.addEventListener('keydown', onDocumentKeydown); });
onUnmounted(() => { window.removeEventListener('focus', onFocus); window.removeEventListener(SESSION_EVENT, onFocus); document.removeEventListener('click', onDocumentClick); document.removeEventListener('keydown', onDocumentKeydown); removeRouteListener(); });
</script>
<style scoped>
.cloud-footer{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;max-width:1440px;margin:0 auto;padding:24px 40px 32px;border-top:1px solid var(--market-border);color:var(--market-muted);font-size:12px}
.cloud-footer strong{color:var(--market-text);font-size:14px}.cloud-footer p{margin:6px 0 0;font-size:12px}.cloud-footer nav{display:flex;gap:12px 20px;flex-wrap:wrap}.cloud-footer a:hover{color:var(--nc-accent)}
@media(max-width:680px){.cloud-footer{padding:24px 20px;gap:18px}}
.cloud-footer{align-items:flex-start;max-width:1280px;padding-block:40px;gap:32px;font-size:13px}.cloud-footer>div{max-width:260px}.cloud-footer strong{font-size:20px}.cloud-footer p{font-size:13px;line-height:1.8}.cloud-footer .footer-sections{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:24px 40px}.footer-sections>div{display:flex;flex-direction:column;align-items:flex-start;gap:6px}.footer-sections h2{font-size:13px;color:var(--market-text);margin-bottom:10px;font-weight:650}.footer-sections a{padding-block:5px;line-height:1.6}.footer-sections a:focus-visible{outline-offset:3px}@media(max-width:700px){.cloud-footer .footer-sections{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.footer-sections a{min-height:44px;display:flex;align-items:center}.cloud-footer{padding:32px 20px}}
.account-mobile-icon{display:none}@media(max-width:700px){.account-mobile-icon{display:block;width:20px;height:20px}.account-label{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.account-status .status-dot{display:none}}
.dashboard-footer{align-items:center;max-width:1440px;padding:24px 40px 32px;gap:24px;font-size:12px}.dashboard-footer strong{font-size:14px}.dashboard-footer p{font-size:12px}.dashboard-footer>div{max-width:none}@media(max-width:680px){.dashboard-footer{padding:24px 20px;gap:18px}}
</style>
