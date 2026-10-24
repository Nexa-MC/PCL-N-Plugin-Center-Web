<template>
  <div class="cloud-shell">
    <a class="skip-link" href="#cloud-content">{{ en ? 'Skip to content' : $ui("跳至内容") }}</a>
    <header class="cloud-header">
      <router-link class="cloud-brand" to="/"><BrandIcon /><strong>NexaCL</strong></router-link>
      <nav :aria-label="en ? 'Site navigation' : $ui('平台入口')"><router-link to="/" :class="{active: route.path === '/'}">{{ en ? 'Home' : $ui("主页") }}</router-link><router-link to="/download" :class="{active: route.path.startsWith('/download')}">{{ en ? 'Download' : $ui("下载") }}</router-link><router-link to="/store" :class="{active: route.path.startsWith('/store')}">{{ en ? 'Store' : $ui("商店") }}</router-link><router-link to="/docs" :class="{active: route.path.startsWith('/docs')}">{{ en ? 'Docs' : $ui("文档") }}</router-link></nav>
      <div class="account-menu">
        <button class="account-status" type="button" :aria-expanded="Boolean(session && menuOpen)" aria-haspopup="menu" @click="openAccount"><span class="status-dot" aria-hidden="true"></span>{{ accountLabel }}</button>
        <div v-if="session && menuOpen" class="account-dropdown" role="menu"><router-link role="menuitem" to="/account" @click="menuOpen = false">{{ en ? 'My account' : $ui("我的账户") }}</router-link><router-link role="menuitem" to="/account?section=developer" @click="menuOpen = false">{{ en ? 'Developer console' : $ui("开发者控制台") }}</router-link><router-link role="menuitem" to="/account?section=website" @click="menuOpen = false">{{ en ? 'Website management' : $ui("网站管理") }}</router-link><div class="account-divider" role="separator"></div><button type="button" role="menuitem" @click="logout">{{ en ? 'Sign out' : $ui("退出登录") }}</button></div>
      </div>
      <LanguageControl />
      <ThemeControl />
    </header>
    <div class="cloud-body">
      <main id="cloud-content" class="cloud-content"><router-view :key="route.path.startsWith('/store') ? 'store' : route.path" /></main>
    </div>
    <footer class="cloud-footer">
      <div><strong>NexaCL</strong><p>{{ $ui('社区开发的 Minecraft 启动器与配套云服务。') }}</p></div>
      <nav :aria-label="$ui('页脚导航')">
        <router-link to="/pricing">{{ $ui('Cloud+ 订阅') }}</router-link>
        <router-link to="/legal/terms">{{ $ui('服务条款') }}</router-link>
        <router-link to="/legal/privacy">{{ $ui('隐私政策') }}</router-link>
        <router-link to="/legal/refunds">{{ $ui('退款与取消政策') }}</router-link>
        <router-link to="/contact">{{ $ui('联系我们') }}</router-link>
        <a v-for="contact in CONTACTS" :key="contact.key" :href="`mailto:${contact.address}`">{{ $ui(contact.label) }}</a>
      </nav>
    </footer>
  </div>
</template>
<script setup lang="ts">
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
const en = computed(() => locale.value !== 'zh');
const session = ref<Session>(), menuOpen = ref(false);
const accountLabel = computed(() => session.value ? (session.value.name || (en.value ? 'Manage account' : '账户管理')) : (en.value ? 'Sign in' : '登录 / 注册'));
async function loadSession() { session.value = await platform.session(); if (session.value && session.value.setupRequired) { void router.push('/register?setup=1'); return; } if (session.value && !session.value.termsAccepted && route.path !== '/account') void router.push('/account'); }
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
</style>
