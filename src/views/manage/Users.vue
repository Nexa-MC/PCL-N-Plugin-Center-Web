<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">IDENTITY</span><h1>{{ $ui("用户管理") }}</h1><p>{{ $ui("查找账户、查看角色并管理账户访问状态。") }}</p></div><button class="secondary-button" :disabled="loading || busy" @click="load">{{ $ui("刷新") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="success" class="form-success" role="status">{{ success }}</p>
    <section class="manage-panel">
      <form class="manage-toolbar" @submit.prevent="search"><label class="manage-search"><KoiIcon name="search" /><input v-model="query" :aria-label='$ui("搜索用户")' maxlength="120" :placeholder='$ui("搜索名称、用户 ID 或邮箱")' /></label><button class="primary-button" :disabled="loading || busy">{{ $ui("搜索") }}</button><span>{{ data?.pagination.total ?? '—' }}{{ $ui(" 个用户") }}</span></form>
      <p v-if="loading" class="manage-empty" role="status">{{ $ui("正在读取用户…") }}</p>
      <div v-else-if="data?.data.length" class="manage-table-wrap"><table class="manage-table"><thead><tr><th>{{ $ui("账户") }}</th><th>{{ $ui("邮箱") }}</th><th>{{ $ui("角色") }}</th><th>{{ $ui("状态") }}</th><th>{{ $ui("注册时间") }}</th><th>{{ $ui("操作") }}</th></tr></thead><tbody><tr v-for="user in data.data" :key="user.id"><td><strong>{{ user.name }}</strong><small>{{ user.handle ? '@' + user.handle : user.id }}</small></td><td>{{ user.email || '未提供' }}</td><td><div class="manage-tags"><span v-if="user.staff" class="manage-tag">{{ $ui("管理员") }}</span><span v-if="user.trustedDeveloper" class="manage-tag">{{ $ui("受信任开发者") }}</span><span v-else-if="user.developer" class="manage-tag">{{ $ui("开发者") }}</span><span v-if="!user.staff && !user.developer" class="manage-muted">{{ $ui("普通用户") }}</span></div></td><td><span class="manage-tag" :class="user.disabled ? 'warning' : 'positive'">{{ user.disabled ? '已停用' : '正常' }}</span></td><td>{{ formatDate(user.createdAt) }}</td><td><span v-if="user.staff" class="manage-muted">{{ $ui("管理员账户受保护") }}</span><button v-else class="manage-text-button" :disabled="busy" @click="selected = user">{{ user.disabled ? '恢复账户' : '停用账户' }}</button></td></tr></tbody></table></div>
      <p v-else-if="data" class="manage-empty">{{ $ui("没有找到符合条件的用户。试试其他名称、用户 ID 或邮箱。") }}</p>
      <Pagination :offset="offset" :total="data?.pagination.total || 0" :busy="loading || busy" @change="changePage" />
    </section>
    <FormDialog :model-value="!!selected" :title="selected?.disabled ? '恢复账户' : '停用账户'" :busy="busy" :error="error" :confirm-label="selected?.disabled ? '确认恢复' : '确认停用'" @update:model-value="selected = undefined" @confirm="confirm"><p>{{ $ui("账户：") }}<strong>{{ selected?.name }}</strong></p><p>{{ selected?.disabled ? '恢复后，该用户可以重新登录。之前撤销的会话不会恢复。' : '停用后将立即撤销该账户的全部会话，该用户将无法登录。你可以稍后恢复账户。' }}</p></FormDialog>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import FormDialog from '@/components/FormDialog.vue';
import KoiIcon from '@/components/KoiIcon.vue';
import { management, type ManagedUser } from '@/api/management';
import Pagination from './Pagination.vue';
import { formatDate, useManagement } from './useManagement';
const offset = ref(0), query = ref(''), term = ref(''), selected = ref<ManagedUser>();
const { data, loading, busy, error, success, load, perform } = useManagement(() => management.users(offset.value, term.value));
function search() { term.value = query.value.trim(); offset.value = 0; void load(); }
function changePage(value: number) { offset.value = value; void load(); }
async function confirm() { const user = selected.value; if (user && await perform(() => management.setDisabled(user, !user.disabled), user.disabled ? '账户已恢复。' : '账户已停用，全部会话已撤销。')) selected.value = undefined; }
</script>
