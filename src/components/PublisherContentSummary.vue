<template>
  <section class="work-panel">
    <div class="section-heading store-summary-heading"><h2>{{ $ui(kind === 'plugin' ? '我的插件概览' : '我的主题概览') }}</h2><div class="actions"><a class="primary-button" :href="consoleOrigin(kind)" target="_blank" rel="noopener noreferrer">{{ $ui('进入内容控制台 ↗') }}</a><button class="secondary-button" :disabled="loading" @click="load">{{ $ui('刷新摘要') }}</button></div></div>
    <p class="store-muted">{{ consoleOrigin(kind).replace('https://', '') }}</p>
    <p v-if="loading" role="status" class="store-muted">{{ $ui('正在读取内容概览…') }}</p><p v-else-if="error" role="alert" class="form-error">{{ $ui(error) }}</p>
    <template v-if="data">
      <div class="store-summary-grid"><div v-for="metric in metrics" :key="metric.key" class="store-summary-cell"><strong>{{ (data.totals[metric.key] || 0).toLocaleString($locale) }}</strong><span>{{ $ui(metric.label) }}</span></div></div>
      <h3>{{ $ui('最近7天制品下载请求') }}</h3><div v-if="data.activity.length" class="store-bars"><div v-for="day in data.activity" :key="day.day" class="store-bar"><span>{{ day.day }}</span><i :style="{ width: `${day.downloads / maximum * 100}%` }" /><strong>{{ day.downloads }}</strong></div></div><p v-else class="store-muted">{{ $ui('暂无下载请求。') }}</p>
      <div v-for="item in data.items.slice(0, 5)" :key="item.id" class="store-content-row"><div><router-link :to="storePath(kind, item.id)">{{ item.name }}</router-link><small>{{ $ui('{0} 人拥有', [item.owner_count]) }} · {{ $ui('{0} 人评分', [item.rating_count]) }}</small></div><span class="status-pill">{{ $ui(storeState(item.state)) }}</span></div><p v-if="!data.items.length" class="store-muted">{{ $ui('还没有自己的内容。') }}</p>
      <p v-if="data.preview" class="store-muted">{{ $ui('前端测试账户仅显示空白预览，不产生商店操作。') }}</p>
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { store, consoleOrigin, storePath, storeState, type PublisherSummary, type StoreKind } from '@/api/store';
import '@/styles/store.css';
const props = defineProps<{ kind: StoreKind }>(), data = ref<PublisherSummary>(), loading = ref(false), error = ref('');
const metrics = [{ key: 'contents', label: '内容总数' }, { key: 'published', label: '已上架' }, { key: 'pending', label: '待审核' }, { key: 'quarantined', label: '已下架待复核' }] as const;
const maximum = computed(() => Math.max(1, ...(data.value?.activity.map(day => day.downloads) || [])));
let generation = 0;
async function load() { const current = ++generation; loading.value = true; error.value = ''; try { const result = await store.summary(props.kind); if (current === generation) data.value = result; } catch (e) { if (current === generation) error.value = e instanceof Error ? e.message : '内容概览读取失败'; } finally { if (current === generation) loading.value = false; } }
watch(() => props.kind, load, { immediate: true });
</script>
