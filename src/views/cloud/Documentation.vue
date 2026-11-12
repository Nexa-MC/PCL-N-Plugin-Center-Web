<template>
  <div class="documentation">
    <header class="docs-intro">
      <p class="eyebrow">NEXACL / DOCUMENTATION</p>
      <h1>{{ c.title }}</h1>
      <p class="docs-description">{{ c.description }}</p>
      <span class="status-pill">SDK 0.2.0-alpha.10 · ABI 100</span>
    </header>

    <section class="guide-grid" :aria-label="c.guidesLabel">
      <article v-for="guide in c.guides" :key="guide.path" class="work-panel guide-card">
        <div class="guide-heading"><KoiIcon :name="guide.icon" /><span>{{ guide.format }}</span></div>
        <h2>{{ guide.title }}</h2>
        <p>{{ guide.description }}</p>
        <ul><li v-for="topic in guide.topics" :key="topic">{{ topic }}</li></ul>
        <a class="guide-start" :href="docsRoot + guide.path + '/' + guide.start">{{ c.start }} <span aria-hidden="true">↗</span></a>
      </article>
    </section>

    <section class="work-panel docs-reference">
      <div><h2>{{ c.examples }}</h2><p>{{ c.exampleDescription }}</p></div>
      <a class="secondary-button" href="https://github.com/Nexa-MC/NexaCL-Plugin-Template">{{ c.viewExamples }} ↗</a>
    </section>
    <section class="legacy-docs">
      <h2>{{ c.other }}</h2><p>{{ c.legacyDescription }}</p>
      <div class="reference-links">
        <a :href="docsRoot + 'plugin-sdk/api/'">{{ c.api }} ↗</a>
        <a :href="docsRoot + 'pxml-compiler/'">PXML ↗</a>
        <a href="https://github.com/Nexa-MC/NexaCL">{{ c.source }} ↗</a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import KoiIcon from '@/components/KoiIcon.vue';
import { applyPageSeo } from '@/utils/seo';

const { locale } = useI18n();
const en = computed(() => locale.value !== 'zh');
const docsRoot = computed(() => 'https://docs.pcln.top/' + (en.value ? 'en/' : ''));
const c = computed(() => en.value ? {
  title: 'Build your first NexaCL plugin.',
  description: 'Start with a runnable plugin, then learn pages, actions, storage and background work. Tutorials, task guides and versioned API reference live at docs.pcln.top.',
  guidesLabel: 'NexaCL development guides', start: 'Start the tutorial',
  guides: [
    { path: 'plugin-sdk', start: 'quickstart', icon: 'code-square', format: 'BOOTSTRAP V1 · ABI 100', title: 'Plugin development', description: 'Build an isolated Wasm plugin using the public SDK and a complete template.', topics: ['A page, confirmed action and persistent data', 'Permissions, cancellation and offline behavior', '346 operations, 245 models and explicit Host support'] },
    { path: 'theme-packs', start: 'quick-start', icon: 'picture', format: 'NTP/1 · ALPHA 14', title: 'Theme packs', description: 'Shape the launcher’s appearance, with controls that let players make it their own.', topics: ['Manifest, NSS styles and light/dark modes', 'Switches, sliders and live option changes', 'Resources, packaging and publishing'] },
    { path: 'sidecar', start: 'quick-start', icon: 'code-square', format: 'NATIVE SIDECAR · ALPHA 14', title: 'Independent extensions', description: 'Build a separate process that communicates with NexaCL through its current Host contracts.', topics: ['A runnable local IPC example', 'Shared NXML pages, lifecycle and binary APIs', 'Cancellation, signatures and distribution'] },
  ],
  examples: 'Start from working source', exampleDescription: 'The public template includes a compiled Wasm guest, NXML page, pinned SDK, deterministic packaging and CI.', viewExamples: 'Use the plugin template',
  other: 'More references', legacyDescription: 'Current SDK references distinguish declared contracts from implemented Host behavior. Theme and native Sidecar examples pin Alpha 14; PXML remains historical reference.', api: 'Plugin API reference', source: 'NexaCL source',
} : {
  title: '从第一个 NexaCL 插件开始。',
  description: '从可运行插件出发，逐步加入页面、动作、存储和后台任务。连续教程、任务指南与版本化 API 参考统一发布于 docs.pcln.top。',
  guidesLabel: 'NexaCL 开发文档', start: '开始教程',
  guides: [
    { path: 'plugin-sdk', start: 'quickstart', icon: 'code-square', format: 'BOOTSTRAP V1 · ABI 100', title: '插件开发', description: '使用公开 SDK 和完整模板，构建隔离运行的 Wasm 插件。', topics: ['页面、确认动作与持久数据', '权限、取消和离线行为', '346 项操作、245 个模型及明确支持范围'] },
    { path: 'theme-packs', start: 'quick-start', icon: 'picture', format: 'NTP/1 · ALPHA 14', title: '主题包开发', description: '设计启动器的外观，也让玩家通过设置控件调整属于自己的样式。', topics: ['清单、NSS 样式与亮暗模式', '滑动开关、滑块与参数实时应用', '资源授权、打包与发布'] },
    { path: 'sidecar', start: 'quick-start', icon: 'code-square', format: 'NATIVE SIDECAR · ALPHA 14', title: 'Sidecar 编写', description: '编写独立进程，通过当前 Host 契约与 NexaCL 交互。', topics: ['可运行的本地 IPC 示例', '共享 NXML 页面、生命周期与二进制 API', '取消、签名准入与分发'] },
  ],
  examples: '从完整源码开始', exampleDescription: '公开模板包含可编译 Wasm 程序、NXML 页面、固定版本 SDK、确定性打包和 CI。', viewExamples: '使用插件模板',
  other: '其他参考', legacyDescription: '当前 SDK 参考明确区分契约声明与宿主实现。主题和原生 Sidecar 示例固定于 Alpha 14，PXML 保留为历史参考。', api: '插件 API 参考', source: 'NexaCL 源码',
});
watchEffect(() => applyPageSeo({ title: en.value ? 'NexaCL developer documentation' : 'NexaCL 开发文档', description: c.value.description, path: '/docs' }));
</script>

<style scoped>
.documentation { max-width: 1120px; margin: 0 auto; }
.docs-intro { max-width: 760px; padding: 20px 0 32px; }
.docs-intro h1 { font-size: clamp(28px, 3.5vw, 42px); line-height: 1.3; margin: 14px 0 18px; letter-spacing: -.7px; }
.docs-description { color: var(--market-muted); margin-bottom: 20px; }
.guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.guide-card { margin: 0; padding: 32px; display: flex; flex-direction: column; }
.guide-heading { display: flex; align-items: center; gap: 12px; color: var(--nc-accent); font-size: 12px; letter-spacing: 1px; }
.guide-heading :deep(svg) { width: 26px; height: 26px; }
.guide-card h2 { margin: 22px 0 14px; font-size: 25px; }
.guide-card p, .guide-card li { color: var(--market-muted); font-size: 14px; line-height: 1.8; }
.guide-card ul { padding-left: 20px; margin: 22px 0 30px; }
.guide-start { color: var(--nc-accent); font-size: 14px; font-weight: 600; margin-top: auto; display: flex; justify-content: space-between; gap: 20px; }
.guide-start:hover, .reference-links a:hover { text-decoration: underline; text-underline-offset: 4px; }
.docs-reference { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin: 24px 0 0; }
.docs-reference h2, .legacy-docs h2 { font-size: 17px; margin-bottom: 10px; }
.docs-reference p, .legacy-docs p { color: var(--market-muted); font-size: 13px; }
.docs-reference a { flex-shrink: 0; }
.legacy-docs { padding: 32px 0 16px; }
.reference-links { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 18px; font-size: 13px; color: var(--nc-accent); }
@media (max-width: 760px) { .guide-grid { grid-template-columns: 1fr; } .guide-card { padding: 24px; } .docs-reference { align-items: flex-start; flex-direction: column; } }
</style>
