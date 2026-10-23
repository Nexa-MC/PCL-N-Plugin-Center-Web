<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">AUDIT LOG</span><h1>{{ $ui("操作审计") }}</h1><p>{{ $ui("查询账户与平台操作记录，追溯变更责任。") }}</p></div><button class="secondary-button" :disabled="loading" @click="load">{{ $ui("刷新") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <section class="manage-panel"><div class="manage-toolbar"><div class="manage-tabs" :aria-label='$ui("审计来源")'><button :class="{ active: source === 'platform' }" @click="filter('platform')">{{ $ui("平台操作") }}</button><button :class="{ active: source === 'identity' }" @click="filter('identity')">{{ $ui("账户与身份") }}</button></div><span>{{ data?.pagination.total ?? '—' }}{{ $ui(" 条记录") }}</span></div>
      <p v-if="loading" class="manage-empty" role="status">{{ $ui("正在读取审计记录…") }}</p>
      <div v-else-if="data?.data.length" class="manage-table-wrap"><table class="manage-table"><thead><tr><th>{{ $ui("时间") }}</th><th>{{ $ui("操作") }}</th><th>{{ $ui("操作人") }}</th><th>{{ $ui("对象 / 详情") }}</th></tr></thead><tbody><tr v-for="entry in data.data" :key="entry.id"><td>{{ formatDate(entry.created_at) }}</td><td><strong>{{ actionLabel(entry.action) }}</strong><small>{{ entry.action }}</small></td><td><code>{{ entry.actor }}</code></td><td class="manage-audit-detail">{{ entry.object_id || entry.detail || '—' }}</td></tr></tbody></table></div>
      <div v-else-if="data" class="manage-empty"><h3>{{ $ui("暂无操作记录") }}</h3><p>{{ $ui("管理操作完成后会自动记录在这里。") }}</p></div>
      <Pagination :offset="offset" :total="data?.pagination.total || 0" :busy="loading" @change="changePage" />
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { management } from '@/api/management';
import Pagination from './Pagination.vue';
import { formatDate, useManagement } from './useManagement';
const offset = ref(0), source = ref('platform');
const { data, loading, error, load } = useManagement(() => management.audit(source.value, offset.value));
function filter(value: string) { source.value = value; offset.value = 0; void load(); }
function changePage(value: number) { offset.value = value; void load(); }
const labels: Record<string, string> = { 'user.disabled': '停用账户', 'user.enabled': '恢复账户', 'resource.created': '创建资源', 'resource.updated': '编辑资源', 'ticket.created': '提交工单', 'ticket.resolved': '解决工单', 'application.submitted': '提交资格申请', 'application.reviewed': '审核资格申请', 'rollouts.updated': '更新灰度策略', 'terms.accepted': '接受服务条款', 'privacy.provided': '查看隐私告知', 'session.revoked': '撤销会话' };
const actionLabel = (value: string) => labels[value] || value;
</script>
