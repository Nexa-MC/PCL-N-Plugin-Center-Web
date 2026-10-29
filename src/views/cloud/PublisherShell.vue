<template>
  <div class="manage-layout publisher-layout">
    <a class="skip-link" href="#publisher-main">{{ $ui('跳至内容') }}</a>
    <aside class="manage-sidebar">
      <router-link class="manage-brand" :to="overview"><BrandIcon /><span>NexaMC<small>{{ $ui(title) }}</small></span></router-link>
      <p class="manage-nav-label">{{ $ui('工作空间') }}</p>
      <nav :aria-label="$ui('后台导航')">
        <router-link v-for="item in navigation" :key="item.path" :to="item.path" :class="{selected: selected(item.path)}" :aria-current="selected(item.path) ? 'page' : 'false'"><KoiIcon :name="item.icon" /><span>{{ $ui(item.label) }}</span></router-link>
      </nav>
      <div class="manage-sidebar-bottom"><span class="manage-domain"><KoiIcon name="shield-tick" />{{ creator ? 'creator.consol.pcln.top' : 'dev.consol.pcln.top' }}</span><a :href="`https://pcln.top/account?section=${creator ? 'creator' : 'developer'}`">{{ $ui('返回账户概览') }}</a><a href="https://pcln.top/">{{ $ui('返回网站 ↗') }}</a></div>
    </aside>
    <div class="manage-body">
      <header class="manage-topbar"><span>{{ $ui(title) }}<span class="manage-breadcrumb"> / {{ $ui(currentTitle) }}</span></span><div><LanguageControl /><ThemeControl /><span class="manage-current-user">{{ session?.name }}</span><button v-if="session" class="secondary-button" :disabled="busy" @click="logout">{{ $ui('退出') }}</button><router-link v-else class="secondary-button" :to="{path:'/login',query:{return:route.fullPath}}">{{ $ui('登录') }}</router-link></div></header>
      <main id="publisher-main" class="manage-main"><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><router-view :key="route.path" /></main>
      <footer class="manage-footer"><span>NexaMC · {{ $ui(title) }}</span><span>{{ $ui('时间以 Asia/Shanghai 显示') }}</span></footer>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BrandIcon from '@/components/BrandIcon.vue';
import KoiIcon from '@/components/KoiIcon.vue';
import ThemeControl from '@/components/ThemeControl.vue';
import LanguageControl from '@/components/LanguageControl.vue';
import { platform, SESSION_EVENT, type Session } from '@/api/platform';
const route = useRoute(), router = useRouter();
const creator = computed(() => route.meta.storeKind === 'theme');
const title = computed(() => creator.value ? '创作者控制台' : '开发者控制台');
const base = computed(() => creator.value ? '/publisher/themes' : '/publisher/plugins');
const overview = computed(() => base.value + '?view=overview');
const navigation = computed(() => [
  {path:overview.value,label:'工作概览',icon:'dashboard'},
  ...(creator.value ? [{path:'/publisher/themes',label:'主题项目',icon:'folder'}] : [{path:'/publisher/plugins',label:'插件项目',icon:'folder'},{path:'/publisher/sidecars',label:'Sidecar 项目',icon:'folder'}]),
  {path:base.value+'?view=finance',label:'商店订单收入与提现',icon:'document'}
]);
function selected(path: string) { const [pathname, query] = path.split('?'); return (route.path === pathname || (!query && route.path.startsWith(pathname + '/'))) && (route.query.view || '') === (new URLSearchParams(query).get('view') || ''); }
const currentTitle = computed(() => navigation.value.find(item => selected(item.path))?.label || title.value);
const session = ref<Session>(), busy = ref(false), error = ref('');
let active = true, generation = 0;
async function refresh() { const step = ++generation; try { const current = await platform.session(); if (active && step === generation) session.value = current; } catch { if (active && step === generation) session.value = undefined; } }
async function logout() { busy.value = true; error.value = ''; try { await platform.logout(); session.value = undefined; await router.replace({path:'/login',query:{return:route.fullPath}}); } catch(e) { error.value = e instanceof Error ? e.message : '退出失败，请重试。'; } finally { busy.value = false; } }
onMounted(() => { void refresh(); window.addEventListener(SESSION_EVENT, refresh); window.addEventListener('focus', refresh); });
onUnmounted(() => { active = false; window.removeEventListener(SESSION_EVENT, refresh); window.removeEventListener('focus', refresh); });
</script>
<style src="../../styles/management.css"></style>
<style scoped>
.publisher-layout .manage-sidebar{overflow-y:auto}.publisher-layout .manage-domain{overflow-wrap:anywhere;font-size:11px}.publisher-layout .manage-brand small{letter-spacing:1px}.publisher-layout .manage-main{min-width:0}.publisher-layout .manage-topbar{flex-wrap:wrap}
</style>
