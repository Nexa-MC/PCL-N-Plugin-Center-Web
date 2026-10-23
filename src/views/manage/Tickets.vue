<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">SUPPORT</span><h1>{{ $ui("支持工单") }}</h1><p>{{ $ui("查看用户反馈，跟进并解决支持请求。") }}</p></div><button class="secondary-button" :disabled="loading || busy" @click="load">{{ $ui("刷新") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="success" class="form-success" role="status">{{ success }}</p>
    <section class="manage-panel"><div class="manage-toolbar"><div class="manage-tabs" :aria-label='$ui("工单状态")'><button :class="{ active: status === 'open' }" :disabled="busy" @click="filter('open')">{{ $ui("待处理") }}</button><button :class="{ active: status === 'resolved' }" :disabled="busy" @click="filter('resolved')">{{ $ui("已解决") }}</button></div><span>{{ data?.pagination.total ?? '—' }}{{ $ui(" 个工单") }}</span></div>
      <p v-if="loading" class="manage-empty" role="status">{{ $ui("正在读取工单…") }}</p>
      <template v-else-if="data?.data.length"><article v-for="ticket in data.data" :key="ticket.id" class="manage-ticket"><div class="manage-ticket-heading"><h2>{{ ticket.subject }}</h2><span class="manage-tag" :class="ticket.status === 'open' ? 'warning' : 'positive'">{{ ticket.status === 'open' ? '待处理' : '已解决' }}</span></div><small class="manage-muted">{{ formatDate(ticket.created_at) }}{{ $ui(" · 用户 ") }}{{ ticket.user_id }}</small><p class="manage-ticket-body">{{ ticket.body }}</p><button v-if="ticket.status === 'open'" class="secondary-button" :disabled="busy" @click="selected = ticket">{{ $ui("标记为已解决") }}</button></article></template>
      <div v-else-if="data" class="manage-empty"><h3>{{ status === 'open' ? '当前没有待处理工单' : '还没有已解决的工单' }}</h3><p>{{ status === 'open' ? '新的支持请求会显示在这里。' : '完成处理后，工单会保留在这里供查阅。' }}</p></div>
      <Pagination :offset="offset" :total="data?.pagination.total || 0" :busy="loading || busy" @change="changePage" />
    </section>
    <FormDialog :model-value="!!selected" :title='$ui("解决工单")' :busy="busy" :error="error" :confirm-label='$ui("确认已解决")' @update:model-value="selected = undefined" @confirm="resolve"><p>{{ $ui("确认已处理完「") }}{{ selected?.subject }}{{ $ui("」？工单将移入已解决列表。") }}</p></FormDialog>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import FormDialog from '@/components/FormDialog.vue';
import { management } from '@/api/management';
import type { Ticket } from '@/api/platform';
import Pagination from './Pagination.vue';
import { formatDate, useManagement } from './useManagement';
const status = ref('open'), offset = ref(0), selected = ref<Ticket>();
const { data, loading, busy, error, success, load, perform } = useManagement(() => management.tickets(offset.value, status.value));
function filter(value: string) { status.value = value; offset.value = 0; void load(); }
function changePage(value: number) { offset.value = value; void load(); }
async function resolve() { const ticket = selected.value; if (ticket && await perform(() => management.resolve(ticket), '工单已标记为已解决。')) selected.value = undefined; }
</script>
