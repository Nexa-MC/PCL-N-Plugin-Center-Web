<template>
  <div class="manage-layout">
    <a class="skip-link" href="#manage-main">{{ $ui("跳至管理内容") }}</a>
    <aside class="manage-sidebar">
      <router-link class="manage-brand" to="/manage"><BrandIcon /><span>NexaMC <small>{{ $ui("网站管理") }}</small></span></router-link>
      <p class="manage-nav-label">{{ $ui("工作空间") }}</p>
      <nav :aria-label='$ui("后台导航")'>
        <router-link v-for="item in navigation" :key="item.path" :to="item.path" :class="{ selected: route.path === item.path }" :aria-current="route.path === item.path ? 'page' : undefined"><KoiIcon :name="item.icon" /><span>{{ $ui(item.label) }}</span></router-link>
      </nav>
      <div class="manage-sidebar-bottom"><span class="manage-domain"><KoiIcon name="shield-tick" /> manage.pcln.top</span><a href="https://pcln.top/" target="_blank" rel="noopener noreferrer">{{ $ui("返回网站 ↗") }}</a></div>
    </aside>
    <div class="manage-body">
      <header class="manage-topbar"><span>{{ $ui("网站后台 ") }}<span class="manage-breadcrumb">/ {{ $ui(route.meta.title || '工作概览') }}</span></span><div><LanguageControl /><ThemeControl /><span class="manage-current-user">{{ session?.name || $ui('管理员工作台') }}</span><button v-if="session" class="secondary-button" :disabled="checking" @click="logout">{{ $ui("退出") }}</button></div></header>
      <main id="manage-main" class="manage-main">
        <div v-if="checking" class="manage-gate" role="status"><KoiIcon name="shield-tick" /><h1>{{ $ui("正在验证管理权限") }}</h1><p>{{ $ui("正在连接 NexaMC ID…") }}</p></div>
        <div v-else-if="error" class="manage-gate"><KoiIcon name="cloud-drizzle" /><h1>{{ $ui("暂时无法验证身份") }}</h1><p role="alert">{{ $ui(error) }}</p><button class="primary-button" @click="verify">{{ $ui("重新连接") }}</button></div>
        <div v-else-if="!session" class="manage-gate"><KoiIcon name="lock-circle" /><span class="manage-eyebrow">{{ $ui('NexaMC 管理后台') }}</span><h1>{{ $ui("登录管理后台") }}</h1><p>{{ $ui("使用已获授权的 NexaMC 账户登录，继续处理网站事务。") }}</p><router-link class="primary-button" :to="{ path: '/login', query: { return: route.fullPath } }">{{ $ui("使用 NexaMC ID 登录") }}</router-link><small>{{ $ui("仅网站管理员可访问业务数据与管理操作。") }}</small></div>
        <div v-else-if="session.staff !== 1" class="manage-gate"><KoiIcon name="shield-search" /><h1>{{ $ui("此账户没有管理权限") }}</h1><p>{{ session.name }}{{ $ui("，后台仅向网站管理员开放。请联系管理员确认你的账户资格。") }}</p><button class="secondary-button" @click="logout">{{ $ui("退出并切换账户") }}</button></div>
        <router-view v-else :key="route.path" />
      </main>
      <footer class="manage-footer"><span>{{ $ui("NexaMC · 管理后台") }}</span><span>{{ $ui("时间以 Asia/Shanghai 显示") }}</span></footer>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BrandIcon from '@/components/BrandIcon.vue';
import KoiIcon from '@/components/KoiIcon.vue';
import ThemeControl from '@/components/ThemeControl.vue';
import LanguageControl from '@/components/LanguageControl.vue';
import { platform, SESSION_EVENT, type Session } from '@/api/platform';
const route = useRoute(), router = useRouter();
const session = ref<Session>(), checking = ref(true), error = ref('');
const navigation = [
  { path: '/manage', label: '工作概览', icon: 'dashboard' },
  { path: '/manage/users', label: '用户管理', icon: 'users' },
  { path: '/manage/resources', label: '资源目录', icon: 'folder' },
  { path: '/manage/project-info', label: '项目信息审核', icon: 'document' },
  { path: '/manage/store', label: '商店审核', icon: 'shield-tick' },
  { path: '/manage/store/security', label: '制品安全审核', icon: 'shield-tick' },
  { path: '/manage/store/finance', label: '财务申请审核', icon: 'document' },
  { path: '/manage/tickets', label: '支持工单', icon: 'messages-bubbles' },
  { path: '/manage/applications', label: '资格审批', icon: 'shield-tick' },
  { path: '/manage/community', label: '公告与问卷', icon: 'chart' },
  { path: '/manage/telemetry', label: '启动器遥测', icon: 'chart' },
  { path: '/manage/audit', label: '操作审计', icon: 'document' }
];
let active = true, generation = 0;
async function verify() {
  const current = ++generation;
  checking.value = true; error.value = '';
  try { const result = await platform.managementSession(); if (active && current === generation) session.value = result; }
  catch (e) { if (active && current === generation) { session.value = undefined; error.value = e instanceof Error ? e.message : '身份服务暂不可用。'; } }
  finally { if (active && current === generation) checking.value = false; }
}
async function logout() {
  try { await platform.managementLogout(); session.value = undefined; await router.replace({ path: '/login', query: { return: route.fullPath } }); }
  catch (e) { error.value = e instanceof Error ? e.message : '退出失败，请重试。'; }
}
const revalidate = () => { if (document.visibilityState === 'visible') void verify(); };
onMounted(() => { void verify(); window.addEventListener('focus', revalidate); window.addEventListener(SESSION_EVENT, revalidate); });
onUnmounted(() => { active = false; window.removeEventListener('focus', revalidate); window.removeEventListener(SESSION_EVENT, revalidate); });
</script>
<style src="../../styles/management.css"></style>
