<template>
  <div class="documentation">
    <header class="docs-intro">
      <p class="eyebrow">NEXACL / DOCUMENTATION</p>
      <h1>{{ c.title }}</h1>
      <p class="docs-description">{{ c.description }}</p>
      <span class="status-pill">Firefly Alpha 14</span>
    </header>

    <section class="guide-grid" :aria-label="c.guidesLabel">
      <article v-for="guide in c.guides" :key="guide.path" class="work-panel guide-card">
        <div class="guide-heading"><KoiIcon :name="guide.icon" /><span>{{ guide.format }}</span></div>
        <h2>{{ guide.title }}</h2>
        <p>{{ guide.description }}</p>
        <ul><li v-for="topic in guide.topics" :key="topic">{{ topic }}</li></ul>
        <a class="guide-start" :href="docsRoot + guide.path + '/quick-start'">{{ c.start }} <span aria-hidden="true">↗</span></a>
      </article>
    </section>

    <section class="work-panel docs-reference">
      <div><h2>{{ c.examples }}</h2><p>{{ c.exampleDescription }}</p></div>
      <a class="secondary-button" href="https://github.com/Nexa-MC/PCLN-Docs/tree/main/examples">{{ c.viewExamples }} ↗</a>
    </section>
    <section class="legacy-docs">
      <h2>{{ c.other }}</h2><p>{{ c.legacyDescription }}</p>
      <div class="reference-links">
        <a :href="docsRoot + 'plugin-sdk/'">{{ c.legacySdk }} ↗</a>
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
  title: 'Make it yours. Build something new.',
  description: 'Create a theme for NexaCL, or write an independent extension. Start with working examples and follow the guide through testing and distribution.',
  guidesLabel: 'NexaCL development guides', start: 'Start the tutorial',
  guides: [
    { path: 'theme-packs', icon: 'picture', format: 'NTP/1', title: 'Theme packs', description: 'Shape the launcher’s appearance, with controls that let players make it their own.', topics: ['Manifest, NSS styles and light/dark modes', 'Switches, sliders and live option changes', 'Resources, packaging and publishing'] },
    { path: 'sidecar', icon: 'code-square', format: 'SIDECAR', title: 'Independent extensions', description: 'Build a separate process that communicates with NexaCL through its current Host contracts.', topics: ['A runnable local IPC example', 'Shared NXML pages, lifecycle and binary APIs', 'Cancellation, signatures and distribution'] },
  ],
  examples: 'Start from working source', exampleDescription: 'A complete theme and a compilable Sidecar example with a real two-process IPC self-test.', viewExamples: 'Browse examples',
  other: 'More references', legacyDescription: 'The legacy Plugin SDK and PXML guides remain available. Legacy .pnp plugins and NexaCL .nsc Sidecars use separate contracts.', legacySdk: 'Legacy Plugin SDK', source: 'NexaCL source',
} : {
  title: '从一个主题开始，写出自己的扩展。',
  description: '为 NexaCL 制作外观主题，或编写独立运行的扩展。从可运行示例出发，一步步完成测试与分发。',
  guidesLabel: 'NexaCL 开发文档', start: '开始教程',
  guides: [
    { path: 'theme-packs', icon: 'picture', format: 'NTP/1', title: '主题包开发', description: '设计启动器的外观，也让玩家通过设置控件调整属于自己的样式。', topics: ['清单、NSS 样式与亮暗模式', '滑动开关、滑块与参数实时应用', '资源授权、打包与发布'] },
    { path: 'sidecar', icon: 'code-square', format: 'SIDECAR', title: 'Sidecar 编写', description: '编写独立进程，通过当前 Host 契约与 NexaCL 交互。', topics: ['可运行的本地 IPC 示例', '共享 NXML 页面、生命周期与二进制 API', '取消、签名准入与分发'] },
  ],
  examples: '从完整源码开始', exampleDescription: '包含一个完整主题，以及可编译、可运行双进程 IPC 自测的 Sidecar 示例。', viewExamples: '浏览示例源码',
  other: '其他参考', legacyDescription: '旧版插件 SDK 与 PXML 文档继续保留。旧版 .pnp 插件与 NexaCL 的 .nsc Sidecar 使用不同契约。', legacySdk: '旧版插件 SDK', source: 'NexaCL 源码',
});
watchEffect(() => applyPageSeo({ title: en.value ? 'NexaCL developer documentation' : 'NexaCL 开发文档', description: c.value.description, path: '/docs' }));
</script>

<style scoped>
.documentation { max-width: 1120px; margin: 0 auto; }
.docs-intro { max-width: 760px; padding: 20px 0 32px; }
.docs-intro h1 { font-size: clamp(28px, 3.5vw, 42px); line-height: 1.3; margin: 14px 0 18px; letter-spacing: -.7px; }
.docs-description { color: var(--market-muted); margin-bottom: 20px; }
.guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
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
