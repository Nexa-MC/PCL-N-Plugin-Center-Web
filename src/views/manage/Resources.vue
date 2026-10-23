<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">CATALOG</span><h1>{{ $ui("资源目录") }}</h1><p>{{ $ui("维护商店资源信息，控制资源的公开展示。") }}</p></div><button class="primary-button" :disabled="busy" @click="edit()">{{ $ui("＋ 新建资源") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="success" class="form-success" role="status">{{ success }}</p>
    <section class="manage-panel"><form class="manage-toolbar" @submit.prevent="search"><label class="manage-search"><KoiIcon name="search" /><input v-model="query" maxlength="120" :aria-label='$ui("搜索资源")' :placeholder='$ui("搜索资源名称或发布者")' /></label><button class="secondary-button" :disabled="loading || busy">{{ $ui("搜索") }}</button><span>{{ data?.pagination.total ?? '—' }}{{ $ui(" 个资源") }}</span></form>
      <p v-if="loading" class="manage-empty" role="status">{{ $ui("正在读取资源目录…") }}</p>
      <div v-else-if="data?.data.length" class="manage-table-wrap"><table class="manage-table"><thead><tr><th>{{ $ui("资源") }}</th><th>{{ $ui("分类") }}</th><th>{{ $ui("发布者") }}</th><th>{{ $ui("版本") }}</th><th>{{ $ui("状态") }}</th><th>{{ $ui("操作") }}</th></tr></thead><tbody><tr v-for="resource in data.data" :key="resource.id"><td><strong>{{ resource.name }}</strong><small class="manage-truncate">{{ resource.summary }}</small></td><td>{{ categoryLabel(resource.category) }}</td><td>{{ resource.publisher }}</td><td>{{ resource.version }}</td><td><span class="manage-tag" :class="resource.published ? 'positive' : ''">{{ resource.published ? '已上架' : '未上架' }}</span></td><td><button class="manage-text-button" :disabled="busy" @click="edit(resource)">{{ $ui("编辑资源") }}</button></td></tr></tbody></table></div>
      <div v-else-if="data" class="manage-empty"><h3>{{ term ? '没有匹配的资源' : '资源目录还是空的' }}</h3><p>{{ term ? '试试其他名称或发布者。' : '新建第一个资源，完善信息后可选择上架。' }}</p></div>
      <Pagination :offset="offset" :total="data?.pagination.total || 0" :busy="loading || busy" @change="changePage" />
    </section>
    <FormDialog v-model="dialog" :title="selected ? '编辑资源' : '新建资源'" width="min(640px, calc(100vw - 32px))" :busy="busy" :error="error" :can-confirm="valid" :confirm-label='$ui("保存资源")' @confirm="save"><div class="manage-form"><label>{{ $ui("名称") }}<input v-model="form.name" required maxlength="120" /></label><div class="manage-form-columns"><label>{{ $ui("分类") }}<select v-model="form.category"><option value="plugin">{{ $ui("插件") }}</option><option value="theme">{{ $ui("主题") }}</option><option value="template">{{ $ui("模板") }}</option></select></label><label>{{ $ui("版本") }}<input v-model="form.version" required maxlength="60" placeholder="1.0.0" /></label></div><label>{{ $ui("发布者") }}<input v-model="form.publisher" required maxlength="120" /></label><label>{{ $ui("简介") }}<textarea v-model="form.summary" required maxlength="400" rows="2" /></label><label>{{ $ui("详细介绍") }}<textarea v-model="form.description" required maxlength="12000" rows="5" /></label><label class="manage-checkbox"><input type="checkbox" v-model="form.published" />{{ $ui("在公开商店中展示此资源") }}</label><p class="manage-muted">{{ $ui("这里管理目录信息。资源文件上传与下载交付尚未接入。") }}</p></div></FormDialog>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import FormDialog from '@/components/FormDialog.vue';
import KoiIcon from '@/components/KoiIcon.vue';
import { management, type ManagedResource, type ResourceInput } from '@/api/management';
import Pagination from './Pagination.vue';
import { useManagement } from './useManagement';
const offset = ref(0), query = ref(''), term = ref(''), dialog = ref(false), selected = ref<ManagedResource>();
const initial = (): ResourceInput => ({ name: '', summary: '', description: '', publisher: '', category: 'plugin', version: '1.0.0', published: false });
const form = reactive<ResourceInput>(initial());
const valid = computed(() => [form.name, form.summary, form.description, form.publisher, form.version].every(v => v.trim()));
const { data, loading, busy, error, success, load, perform } = useManagement(() => management.resources(offset.value, term.value));
const categoryLabel = (category: string) => ({ plugin: '插件', theme: '主题', template: '模板' }[category] || category);
function edit(resource?: ManagedResource) { selected.value = resource; Object.assign(form, resource ? { name: resource.name, summary: resource.summary, description: resource.description, publisher: resource.publisher, category: resource.category, version: resource.version, published: Boolean(resource.published) } : initial()); error.value = ''; dialog.value = true; }
function search() { term.value = query.value.trim(); offset.value = 0; void load(); }
function changePage(value: number) { offset.value = value; void load(); }
async function save() { if (valid.value && await perform(() => management.saveResource({ ...form }, selected.value), '资源已保存。')) dialog.value = false; }
</script>
