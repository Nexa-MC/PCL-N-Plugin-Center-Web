<template>
  <section class="model-panel" :aria-busy="loading">
    <header><div><h2>{{ $ui("预检模型") }}</h2><p>{{ $ui("查看模型状态与历史验证结果。") }}</p></div><button :disabled="loading" @click="load">{{ loading ? $ui("正在读取…") : $ui("刷新模型") }}</button></header>
    <p v-if="error" class="notice" role="status">{{ $ui(error) }}</p>
    <template v-if="model">
      <div class="model-summary">
        <div><span>{{ $ui("发布状态") }}</span><strong>{{ $ui("旧模型已停用") }}</strong></div>
        <div><span>{{ $ui("历史分组") }}</span><strong>{{ model.models.length }}<small> {{ $ui("个") }}</small></strong></div>
        <div><span>{{ $ui("历史运行") }}</span><strong>{{ sessions }}<small> {{ $ui("次") }}</small></strong></div>
      </div>
      <p class="updated">{{ $ui("生成于") }} {{ date(model.generatedAt) }} {{ $ui("· 有效至") }} {{ date(model.expiresAt) }}</p>
      <div v-if="model.models.length" class="cohorts">
        <article v-for="item in model.models" :key="`${item.os}/${item.loader}`">
          <div class="cohort-title"><h3>{{ platform(item.os) }} <span>／ {{ item.loader === 'Vanilla' ? $ui("原版 Minecraft") : item.loader }}</span></h3><span class="status">{{ expired ? $ui("历史结果 · 已过期") : $ui("历史结果 · 已停用") }}</span></div>
          <dl>
            <div><dt>{{ $ui("训练 / 验证运行") }}</dt><dd>{{ item.samples }} / {{ item.validationSamples }} {{ $ui("次") }}</dd></div>
            <div><dt>{{ $ui("验证覆盖率") }}</dt><dd>{{ (item.coverage * 100).toFixed(0) }}%</dd></div>
            <div><dt>{{ $ui("分位损失 / 基线") }}</dt><dd>{{ item.validationLossMiB.toFixed(1) }} / {{ item.baselineLossMiB.toFixed(1) }} MiB</dd></div>
            <div><dt>{{ $ui("训练堆范围") }}</dt><dd>{{ range(item.featureMin[1] * 4, item.featureMax[1] * 4) }} GiB</dd></div>
            <div><dt>{{ $ui("类路径条目") }}</dt><dd>{{ range(item.featureMin[2] * 256, item.featureMax[2] * 256) }}</dd></div>
            <div><dt>{{ $ui("渲染距离") }}</dt><dd>{{ range(Math.sqrt(item.featureMin[3] * 256), Math.sqrt(item.featureMax[3] * 256)) }} {{ $ui("区块") }}</dd></div>
          </dl>
        </article>
      </div>
      <div v-else class="empty"><h3>{{ $ui("等待新的模型验证") }}</h3><p>{{ $ui("旧模型未区分模组组合与游戏场景，已停止用于预检。遥测继续采集，新模型通过验证前使用本地估算。") }}</p></div>
    </template>
    <div v-else-if="!loading" class="empty"><h3>{{ $ui("尚无可展示的模型") }}</h3><p>{{ $ui("模型不可用时，启动器继续使用本地估算。") }}</p></div>
    <aside><h3>{{ $ui("这些数据说明什么") }}</h3><p>{{ $ui("模型估算游戏进程的工作集峰值。运行次数不是用户人数；覆盖率是验证样本中，实际峰值未超过预测值的比例。分位损失越低越好，但不是普通平均误差。") }}</p><p>{{ $ui("旧模型的权重已停止发布，历史验证结果不代表对具体整合包有效。新模型需要匹配模组版本、组合和游戏场景；它仍处于开发阶段。这些数据不是 JVM 堆或原生内存的实测值，也不能据此强制阻止启动。") }}</p></aside>
  </section>
</template>

<script setup lang="ts">
import { uiLocale } from '@/languages/localize';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { isTestSession } from '@/api/platform';
type Cohort = { os: string; loader: string; samples: number; validationSamples: number; coverage: number; validationLossMiB: number; baselineLossMiB: number; featureMin: number[]; featureMax: number[] };
type Model = { generatedAt: string; expiresAt: string; models: Cohort[] };
const model = ref<Model>();
const loading = ref(false);
const error = ref('');
const now = ref(Date.now());
const expired = computed(() => !!model.value && Date.parse(model.value.expiresAt) <= now.value);
const sessions = computed(() => model.value?.models.reduce((sum, item) => sum + item.samples + item.validationSamples, 0) ?? 0);
const date = (value: string) => new Date(value).toLocaleString(uiLocale.value);
const platform = (value: string) => ({ windows: 'Windows', linux: 'Linux', macos: 'macOS' })[value] ?? value;
const range = (low: number, high: number) => low === high ? `${+low.toFixed(2)}` : `${+low.toFixed(2)}–${+high.toFixed(2)}`;
let request: AbortController | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
function validate(value: any): Model {
  if (value?.schema !== 1 || value.metric !== 'process-working-set-peak-mib' || !Array.isArray(value.models) || value.models.length > 27
    || !Number.isFinite(Date.parse(value.generatedAt)) || !Number.isFinite(Date.parse(value.expiresAt))) throw new Error('invalid');
  const generated = Date.parse(value.generatedAt), expires = Date.parse(value.expiresAt);
  if (generated > Date.now() + 300000 || expires <= generated || expires - generated > 7 * 86400000) throw new Error('invalid');
  const keys = new Set<string>();
  let total = 0;
  for (const item of value.models) {
    const key = `${item.os}/${item.loader}`;
    if (!['windows','linux','macos'].includes(item.os) || !['Vanilla','OptiFine','Forge','NeoForge','Fabric','Quilt','LiteLoader','Cleanroom','LabyMod'].includes(item.loader) || keys.has(key)
      || !Number.isInteger(item.samples) || item.samples < 40 || item.samples > 102 || !Number.isInteger(item.validationSamples) || item.validationSamples < 10 || item.validationSamples > 26
      || !Number.isFinite(item.coverage) || item.coverage < .8 || item.coverage > 1
      || !Number.isFinite(item.validationLossMiB) || !Number.isFinite(item.baselineLossMiB) || item.validationLossMiB < 0 || item.baselineLossMiB < item.validationLossMiB
      || ![item.featureMin,item.featureMax].every(v => Array.isArray(v) && v.length === 4 && v.every(n => Number.isFinite(n) && n >= 0 && n <= 16))
      || item.featureMin.some((n: number, i: number) => n > item.featureMax[i])) throw new Error('invalid');
    total += item.samples + item.validationSamples;
    if (total > 128 || item.validationSamples !== Math.ceil((item.samples + item.validationSamples) / 5)) throw new Error('invalid');
    const lower = [1, .0625, 1 / 256, 4 / 256], upper = [1, 16, 16, 16];
    for (let i = 0; i < 4; i++) if (item.featureMin[i] < lower[i] || item.featureMax[i] > upper[i]) throw new Error('invalid');
    keys.add(key);
  }
  return value;
}
async function load() {
  // 前端测试账户没有真实模型接口；与线上一致，展示“模型已停用”的空状态而非报错。
  if (isTestSession()) { model.value = undefined; error.value = ''; loading.value = false; return; }
  request?.abort();
  const controller = new AbortController(); request = controller;
  const timeout = setTimeout(() => controller.abort(), 10000);
  loading.value = true; error.value = '';
  try {
    const response = await fetch('/api/v1/telemetry/resource-model', { signal: controller.signal, credentials: 'same-origin', cache: 'no-cache' });
    if (!response.ok) throw new Error(response.status === 503 ? 'unavailable' : 'network');
    const reader = response.body?.getReader(); if (!reader) throw new Error('network');
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 65536) throw new Error('invalid'); chunks.push(value); }
    } finally { await reader.cancel(); reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const next = validate(JSON.parse(new TextDecoder().decode(bytes)));
    if (request === controller && !controller.signal.aborted) { model.value = next; now.value = Date.now(); }
  } catch (failure) {
    if (request === controller) error.value = failure instanceof Error && failure.message === 'unavailable'
      ? '服务暂未提供模型。可能尚未生成，或读取暂时失败。' : '暂时无法更新模型信息。';
    if (request === controller && model.value) error.value += ' 下方保留上次读取的结果。';
  } finally { clearTimeout(timeout); if (request === controller) loading.value = false; }
}
onMounted(() => { void load(); timer = setInterval(() => { now.value = Date.now(); }, 30000); });
onBeforeUnmount(() => { const current = request; request = undefined; current?.abort(); clearInterval(timer); });
</script>

<style scoped>
.model-panel{padding:32px;border:1px solid var(--el-border-color-lighter);border-radius:22px;background:var(--el-bg-color)}
header,.cohort-title{display:flex;align-items:center;justify-content:space-between;gap:20px}h2{font-size:24px;letter-spacing:-.5px;margin:0}p{color:var(--el-text-color-secondary);line-height:1.7;font-size:13px}button{border:0;border-radius:20px;padding:10px 18px;white-space:nowrap;background:var(--el-fill-color-light);color:var(--el-text-color-primary);cursor:pointer}button:active{transform:scale(.97)}button:focus-visible{outline:2px solid var(--el-color-primary);outline-offset:3px}button:disabled{opacity:.6;cursor:wait}
.model-summary{display:grid;grid-template-columns:2fr 1fr 1fr;gap:24px;padding:30px 0}.model-summary span,dt,.updated{color:var(--el-text-color-secondary);font-size:12px}.model-summary strong{display:block;font-size:25px;font-weight:550;letter-spacing:-.6px;margin-top:10px}.model-summary small{font-size:12px;font-weight:400}.updated{margin:0 0 24px}.cohorts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px}article{border-top:1px solid var(--el-border-color-lighter);padding-top:20px}h3{font-size:15px;font-weight:550;margin:0}.cohort-title h3 span{font-weight:400}.status{font-size:11px;color:var(--el-text-color-secondary);white-space:nowrap}dl{margin-bottom:0}dl div{display:flex;justify-content:space-between;gap:12px;padding:9px 0}dd{margin:0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums}.empty{text-align:center;padding:48px 20px}.empty p{max-width:480px;margin:12px auto}aside{margin-top:30px;padding-top:24px;border-top:1px solid var(--el-border-color-lighter)}aside p:last-child{margin-bottom:0}.notice{padding:12px 16px;border-radius:12px;background:var(--el-fill-color-light)}
@media(max-width:850px){.cohorts{grid-template-columns:1fr}.model-summary{grid-template-columns:1fr 1fr}.model-summary>div:first-child{grid-column:1/-1}}@media(max-width:600px){.model-panel{padding:22px}header{align-items:flex-start;flex-wrap:wrap}.model-summary strong{font-size:22px}}@media(prefers-reduced-motion:reduce){button:active{transform:none}}
</style>
