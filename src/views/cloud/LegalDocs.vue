<template>
  <section class="legal-page">
    <template v-if="!doc">
      <div class="section-heading"><div><p class="eyebrow">{{ $ui("法律文档") }}</p><h1>{{ $ui("法律文档") }}</h1></div></div>
      <p class="legal-intro">{{ $ui("以下文档适用于 Nexa Cloud、NexaStore 及相关在线服务。历史版本保存在归档目录中。") }}</p>
      <div v-for="item in documents" :key="item.key" class="work-panel legal-entry">
        <div><h2><router-link :to="`/legal/${item.key}`">{{ $ui(item.title) }}</router-link></h2><small>{{ $ui("版本") }} {{ item.version }} {{ $ui("· 生效日期") }} {{ item.effective }}</small><p>{{ $ui(item.summary) }}</p></div>
        <router-link class="secondary-button" :to="`/legal/${item.key}`">{{ $ui("阅读") }}</router-link>
      </div>
      <section class="work-panel">
        <h2>{{ $ui("历史归档") }}</h2>
        <p>{{ $ui("历史原文用于追溯当时提供的约定和告知。1.1 修订不会将旧版本记录改为新版本同意。") }}</p>
        <p>{{ $ui('历史归档为当时提供的中文原文。') }}</p><div class="legal-archive"><a href="/legal/archive/1.0/terms.zh-CN.md">{{ $ui("服务条款 v1.0 · 2026-09-26") }}</a><a href="/legal/archive/1.0/privacy.zh-CN.md">{{ $ui("隐私政策 v1.0 · 2026-09-26") }}</a><a href="/legal/archive/0.2/terms.md">{{ $ui("N Cloud 用户服务协议 v0.2") }}</a><a href="/legal/archive/0.2/privacy.md">{{ $ui("N Cloud 隐私保护协议 v0.2") }}</a></div>
      </section>
    </template>
    <template v-else-if="documents.find(d => d.key === doc)">
      <div class="section-heading"><div><p class="eyebrow">{{ $ui("法律文档") }}</p><h1>{{ $ui(current.title) }}</h1></div><router-link class="secondary-button" to="/legal">{{ $ui("全部文档") }}</router-link></div>
      <p v-if="$locale === 'en-US'" class="legal-intro">{{ $ui('英文译文供阅读参考，确认记录仍对应所示版本的中文原文。') }} <a :href="current.file">{{ $ui('查看中文原文') }}</a></p>
      <p class="legal-meta">{{ $ui("版本") }} {{ current.version }} {{ $ui("· 生效日期") }} {{ current.effective }} · {{ $locale === 'en-US' ? $ui('中文原文 SHA-256') : 'SHA-256' }} <code>{{ current.hash.slice(0, 32) }}…</code> · <a :href="displayFile" download>{{ $ui("下载 Markdown") }}</a></p>
      <p v-if="loading" class="empty-state" role="status">{{ $ui("正在加载文档…") }}</p>
      <p v-else-if="error" class="empty-state" role="alert">{{ $ui(error) }}<br><a :href="displayFile">{{ $ui("直接查看原始文档") }}</a></p>
      <article v-else class="work-panel legal-doc" v-html="rendered"></article>
      <p v-if="doc === 'privacy'" class="legal-intro">{{ $ui('语言选择保存在此浏览器的 nexa:lang，可通过切换语言或清除浏览器存储更改；不包含账户令牌，不同步到账户数据库。') }}</p>
    </template>
    <section v-else class="work-panel not-found"><h2>{{ $ui("文档不存在") }}</h2><router-link class="text-link" to="/legal">{{ $ui("返回法律文档索引 ›") }}</router-link></section>
  </section>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import { uiLocale } from '@/languages/localize';

const documents = [
  { key: 'terms', title: 'Nexa Cloud 服务条款', version: '1.1', effective: '2026-10-01', hash: '9033b50cfb0e14f4f4758adf610bb063529ec2443d879420105479cf067729f5', file: '/legal/current/terms.zh-CN.md', summary: '账户安全、社区关联、等级经验与铭牌，以及资源、付费服务和用户权利。' },
  { key: 'privacy', title: 'Nexa Cloud 隐私政策', version: '1.1', effective: '2026-10-01', hash: '8e45f1f498b955232abc6e149acc5c7f71fb5e70f5e1b1e8b1c5eeb28911520b', file: '/legal/current/privacy.zh-CN.md', summary: '账户与验证方式、可选授权、等级活动、技术遥测、数据保存及你的选择和权利。' },
  { key: 'publisher', title: 'NexaStore 发布者分发协议', version: '1.0', effective: '2026-09-26', hash: '0f35d7e2ba59c413f4da1fabddffebb69002d477b6056ef4ada390d078802678', file: '/legal/current/publisher.zh-CN.md', summary: '向 NexaStore 上传或维护资源的发布者签订的分发协议，覆盖发布资格、许可证、审核、下架与安全撤销。' },
  { key: 'refunds', title: 'Nexa 退款、试用与订阅政策', version: '1.0', effective: '2026-09-26', hash: '7af2704ab5c01f3e275500165590e67802cf3776531dd2cf55ebdb0dabab8345', file: '/legal/current/refunds.zh-CN.md', summary: '适用于 Nexa 自营付费服务的退款、Lite 免费试用、自动续费、付款失败与套餐降级规则。' }
];

const route = useRoute();
const doc = computed(() => typeof route.params.doc === 'string' ? route.params.doc : '');
const current = computed(() => documents.find(d => d.key === doc.value) ?? documents[0]);
const displayFile = computed(() => uiLocale.value === 'en-US' ? current.value.file.replace('.zh-CN.md', '.en.md') : current.value.file);
const content = ref(''), loading = ref(false), error = ref('');
const rendered = computed(() => marked.parse(content.value, { async: false, gfm: true, breaks: false }));

let generation = 0;
let controller: AbortController | undefined;
async function load(file: string) {
  const request = ++generation;
  controller?.abort();
  controller = new AbortController();
  loading.value = true; error.value = ''; content.value = '';
  try {
    const response = await fetch(file, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
    if (!response.ok) throw new Error(`文档加载失败 (${response.status})`);
    const text = await response.text();
    if (request === generation) content.value = text;
  } catch (e) { if (request === generation) error.value = e instanceof Error ? e.message : '文档加载失败，请稍后重试。'; }
  finally { if (request === generation) loading.value = false; }
}
watch([doc, displayFile], () => { if (documents.some(d => d.key === doc.value)) void load(displayFile.value); }, { immediate: true });
onUnmounted(() => { generation++; controller?.abort(); });
</script>
