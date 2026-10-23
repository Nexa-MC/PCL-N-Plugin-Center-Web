<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">{{ $ui('概览') }}</span><h1>{{ $ui("工作概览") }}</h1><p>{{ $ui("查看网站状态，处理需要关注的事务。") }}</p></div><button class="secondary-button" :disabled="loading" @click="load">{{ $ui(loading ? '更新中…' : '刷新数据') }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
    <p v-if="loading && !data" class="manage-empty" role="status">{{ $ui("正在读取网站数据…") }}</p>
    <template v-if="data">
      <div class="manage-stat-grid">
        <router-link v-for="stat in stats" :key="stat.label" :to="stat.to" class="manage-stat"><div><span>{{ $ui(stat.label) }}</span><KoiIcon :name="stat.icon" /></div><strong>{{ formatNumber(stat.value) }}</strong><small>{{ stat.hint }}</small></router-link>
      </div>
      <section class="manage-panel"><div class="manage-section-heading"><div><h2>{{ $ui("待处理事项") }}</h2><p>{{ $ui("从待办开始，保持网站运行有序。") }}</p></div><span class="manage-tag">{{ $ui("实时数据") }}</span></div>
        <router-link class="manage-task" to="/manage/tickets"><span class="manage-task-icon"><KoiIcon name="messages-bubbles" /></span><span><strong>{{ $ui("用户支持工单") }}</strong><small>{{ $ui("查看问题详情，完成处理并关闭工单。") }}</small></span><b>{{ $ui('{0} 待处理 →', [formatNumber(data.platform.openTickets)]) }}</b></router-link>
        <router-link class="manage-task" to="/manage/applications"><span class="manage-task-icon"><KoiIcon name="shield-tick" /></span><span><strong>{{ $ui("账户资格申请") }}</strong><small>{{ $ui("审核开发者、受信任开发者及管理员申请。") }}</small></span><b>{{ $ui('{0} 待审核 →', [formatNumber(data.identity.pendingApplications)]) }}</b></router-link>
      </section>
      <div class="manage-overview-bottom"><section class="manage-panel"><h2>{{ $ui("资源发布") }}</h2><p>{{ $ui('当前有 {0} 个资源在商店公开展示，{1} 个尚未上架。', [formatNumber(data.platform.publishedResources), formatNumber(data.platform.resources - data.platform.publishedResources)]) }}</p><router-link class="secondary-button" to="/manage/resources">{{ $ui("管理资源目录 →") }}</router-link></section><section class="manage-panel"><h2>{{ $ui("可追溯的管理操作") }}</h2><p>{{ $ui("账户状态变更、资源编辑、工单处理与资格审批均保存操作记录。") }}</p><router-link class="secondary-button" to="/manage/audit">{{ $ui("查看操作审计 →") }}</router-link></section></div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import KoiIcon from '@/components/KoiIcon.vue';
import { management } from '@/api/management';
import { ui } from '@/languages/localize';
import { formatNumber, useManagement } from './useManagement';
const { data, loading, error, load } = useManagement(async () => { const [platform, identity] = await Promise.all([management.platformSummary(), management.identitySummary()]); return { platform, identity }; });
const stats = computed(() => data.value ? [
  { label: '注册用户', value: data.value.identity.users, hint: ui('{0} 个账户已停用', [formatNumber(data.value.identity.disabledUsers)]), icon: 'users', to: '/manage/users' },
  { label: '公开资源', value: data.value.platform.publishedResources, hint: ui('共 {0} 个目录资源', [formatNumber(data.value.platform.resources)]), icon: 'folder', to: '/manage/resources' },
  { label: '待处理工单', value: data.value.platform.openTickets, hint: ui('{0} 个工单已解决', [formatNumber(data.value.platform.resolvedTickets)]), icon: 'messages-bubbles', to: '/manage/tickets' },
  { label: '待审资格', value: data.value.identity.pendingApplications, hint: ui('账户资格申请'), icon: 'shield-tick', to: '/manage/applications' }
] : []);
</script>
