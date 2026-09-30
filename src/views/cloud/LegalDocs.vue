<template>
  <section class="legal-page">
    <template v-if="!doc">
      <div class="section-heading"><div><p class="eyebrow">LEGAL</p><h1>法律文档</h1></div></div>
      <p class="legal-intro">以下文档适用于 Nexa Cloud、NexaStore 及相关在线服务。历史版本保存在归档目录中。</p>
      <div v-for="item in documents" :key="item.key" class="work-panel legal-entry">
        <div><h2><router-link :to="`/legal/${item.key}`">{{ item.title }}</router-link></h2><small>版本 {{ item.version }} · 生效日期 {{ item.effective }}</small><p>{{ item.summary }}</p></div>
        <router-link class="secondary-button" :to="`/legal/${item.key}`">阅读</router-link>
      </div>
      <section class="work-panel">
        <h2>历史归档</h2>
        <p>历史原文用于追溯当时提供的约定和告知。1.1 修订不会将旧版本记录改为新版本同意。</p>
        <div class="legal-archive"><a href="/legal/archive/1.0/terms.zh-CN.md">服务条款 v1.0 · 2026-09-26</a><a href="/legal/archive/1.0/privacy.zh-CN.md">隐私政策 v1.0 · 2026-09-26</a><a href="/legal/archive/0.2/terms.md">N Cloud 用户服务协议 v0.2</a><a href="/legal/archive/0.2/privacy.md">N Cloud 隐私保护协议 v0.2</a></div>
      </section>
    </template>
    <template v-else-if="documents.find(d => d.key === doc)">
      <div class="section-heading"><div><p class="eyebrow">LEGAL</p><h1>{{ current.title }}</h1></div><router-link class="secondary-button" to="/legal">全部文档</router-link></div>
      <p class="legal-meta">版本 {{ current.version }} · 生效日期 {{ current.effective }} · SHA-256 <code>{{ current.hash.slice(0, 32) }}…</code> · <a :href="current.file" download>下载 Markdown</a></p>
      <p v-if="loading" class="empty-state" role="status">正在加载文档…</p>
      <p v-else-if="error" class="empty-state" role="alert">{{ error }}<br><a :href="current.file">直接查看原始文档</a></p>
      <article v-else class="work-panel legal-doc" v-html="rendered"></article>
    </template>
    <section v-else class="work-panel not-found"><h2>文档不存在</h2><router-link class="text-link" to="/legal">返回法律文档索引 ›</router-link></section>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';

const documents = [
  { key: 'terms', title: 'Nexa Cloud 服务条款', version: '1.1', effective: '2026-10-01', hash: '9033b50cfb0e14f4f4758adf610bb063529ec2443d879420105479cf067729f5', file: '/legal/current/terms.zh-CN.md', summary: '账户安全、社区关联、等级经验与铭牌，以及资源、付费服务和用户权利。' },
  { key: 'privacy', title: 'Nexa Cloud 隐私政策', version: '1.1', effective: '2026-10-01', hash: '8e45f1f498b955232abc6e149acc5c7f71fb5e70f5e1b1e8b1c5eeb28911520b', file: '/legal/current/privacy.zh-CN.md', summary: '账户与验证方式、可选授权、等级活动、技术遥测、数据保存及你的选择和权利。' },
  { key: 'publisher', title: 'NexaStore 发布者分发协议', version: '1.0', effective: '2026-09-26', hash: '0f35d7e2ba59c413f4da1fabddffebb69002d477b6056ef4ada390d078802678', file: '/legal/current/publisher.zh-CN.md', summary: '向 NexaStore 上传或维护资源的发布者签订的分发协议，覆盖发布资格、许可证、审核、下架与安全撤销。' },
  { key: 'refunds', title: 'Nexa 退款、试用与订阅政策', version: '1.0', effective: '2026-09-26', hash: '7af2704ab5c01f3e275500165590e67802cf3776531dd2cf55ebdb0dabab8345', file: '/legal/current/refunds.zh-CN.md', summary: '适用于 Nexa 自营付费服务的退款、Lite 免费试用、自动续费、付款失败与套餐降级规则。' }
];

const route = useRoute();
const doc = computed(() => typeof route.params.doc === 'string' ? route.params.doc : '');
const current = computed(() => documents.find(d => d.key === doc.value) ?? documents[0]);
const content = ref(''), loading = ref(false), error = ref('');
const rendered = computed(() => marked.parse(content.value, { async: false, gfm: true, breaks: false }));

async function load(file: string) {
  loading.value = true; error.value = ''; content.value = '';
  try {
    const response = await fetch(file, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`文档加载失败 (${response.status})`);
    content.value = await response.text();
  } catch (e) { error.value = e instanceof Error ? e.message : '文档加载失败，请稍后重试。'; }
  finally { loading.value = false; }
}
watch(() => doc.value, () => { if (documents.some(d => d.key === doc.value)) void load(current.value.file); }, { immediate: true });
</script>
