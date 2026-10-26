<template>
  <section>
    <h3>{{ $ui('最近的运行记录') }}</h3>
    <el-alert v-if="error" :title="$ui(error)" type="error" :closable="false"/>
    <el-table v-loading="loading" :data="runs" :empty-text="$ui('尚无运行记录')">
      <el-table-column prop="day" :label="$ui('日期')"/>
      <el-table-column prop="version" :label="$ui('启动器版本')"/>
      <el-table-column prop="os" :label="$ui('平台')"/>
      <el-table-column :label="$ui('运行状态')"><template #default="{row}">{{ $ui(row.ended ? '已收到退出样本' : '尚未收到退出样本') }}</template></el-table-column>
      <el-table-column width="100"><template #default="{row}"><el-button link type="primary" @click="open(row.run)">{{ $ui('查看') }}</el-button></template></el-table-column>
    </el-table>
    <el-dialog v-model="visible" :title="$ui('单次运行数据')" width="min(900px, 94vw)" @closed="clearDetail">
      <p>{{ $ui('启动配置不代表实际用量；未测得的指标保留为空。记录不包含账号、路径或原始日志。') }}</p>
      <el-alert v-if="detailError" :title="$ui(detailError)" type="error" :closable="false"/>
      <div v-loading="detailLoading" class="detail">
        <template v-if="detail">
          <h3>{{ $ui('版本与加载器') }}</h3>
          <el-descriptions v-if="detail.mods[0]" :column="2" border>
            <el-descriptions-item :label="$ui('Minecraft 版本')">{{ detail.mods[0].game }}</el-descriptions-item>
            <el-descriptions-item :label="$ui('加载器')">{{ detail.mods[0].loader }} {{ detail.mods[0].loader_version }}</el-descriptions-item>
          </el-descriptions>
          <h3>{{ $ui('已识别的模组元数据') }}</h3>
          <p v-if="partialInventory">{{ $ui('此清单包含未识别或被截断的数据，不能视为完整的运行时模组清单。') }}</p>
          <el-table :data="mods" max-height="320" :empty-text="$ui('尚未收到此项数据')">
            <el-table-column prop="id" :label="$ui('模组')" min-width="150"/>
            <el-table-column prop="version" :label="$ui('版本')" min-width="100"/>
            <el-table-column prop="format" :label="$ui('元数据格式')" min-width="160"/>
            <el-table-column :label="$ui('启用')"><template #default="{row}">{{ $ui(row.enabled ? '是' : '否') }}</template></el-table-column>
            <el-table-column :label="$ui('嵌套候选')"><template #default="{row}">{{ row.nested === undefined ? $ui('未采集') : $ui(row.nested ? '是' : '否') }}</template></el-table-column>
            <el-table-column prop="sha256" label="SHA-256" min-width="180" show-overflow-tooltip/>
          </el-table>
          <template v-for="group in groups" :key="group.event">
            <h3>{{ $ui(group.title) }}</h3>
            <el-empty v-if="!detail.lifecycle?.[group.event]" :description="$ui('尚未收到此项数据')"/>
            <el-descriptions v-else :column="2" border>
              <el-descriptions-item v-for="field in group.fields" :key="field.key" :label="$ui(field.label)">{{ field.key === 'exit' && detail.lifecycle[group.event]?.exit_observed === '1' ? detail.lifecycle[group.event]?.exit : display(detail.lifecycle[group.event]?.[field.key], field.unit) }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </template>
      </div>
    </el-dialog>
  </section>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { pluginCenterApi } from '@/api/pluginCenter';
import { ui, uiLocale } from '@/languages/localize';
const props = defineProps<{ days: number; version: string; os: string }>();
type Run = Awaited<ReturnType<typeof pluginCenterApi.launcherRuns>>['runs'][number];
type Detail = Awaited<ReturnType<typeof pluginCenterApi.launcherRun>>;
const runs = ref<Run[]>([]), loading = ref(false), error = ref('');
const detail = ref<Detail>(), detailLoading = ref(false), detailError = ref(''), visible = ref(false);
let listGeneration = 0, detailGeneration = 0;
type Mod = {id:string;version:string;format:string;enabled:boolean;nested?:boolean;sha256?:string|null;complete:boolean};
const mods = computed<Mod[]>(() => (detail.value?.mods ?? []).flatMap(page => {
  try { const value: unknown = JSON.parse(page.mods ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}));
const partialInventory = computed(() => !detail.value?.mods.length || detail.value.mods.length !== Number(detail.value.mods[0]?.pages) || detail.value.mods.some(page=>page.complete !== '1' || Number(page.unknown) > 0) || mods.value.some(mod=>!mod.complete));
const fields = (values: [string, string, string?][]) => values.map(([key,label,unit])=>({key,label,unit}));
const groups = [
  {event:'diagnostic.launch',title:'启动配置',fields:fields([
    ['java','Java 主版本'],['classpath','类路径条目数'],['libraries','依赖库数量'],['natives','原生库数量'],['heap_mib','配置堆上限','MiB'],
    ['cpu_sets','指定逻辑处理器数'],['cpu_quota','CPU 配额','%'],['memory_limit_mib','进程内存配额','MiB'],
    ['read_limit_mib','磁盘读取配额','MiB/s'],['write_limit_mib','磁盘写入配额','MiB/s'],['gamemode','请求 GameMode','bool'],['wrapped','使用包装命令','bool']
  ])},
  {event:'diagnostic.run-summary',title:'实际运行汇总',fields:fields([
    ['elapsed_ms','运行时长','ms'],['launch_ms','启动耗时','ms'],['exit','退出码'],['working_peak','工作集峰值','bytes'],['private_peak','私有内存峰值','bytes'],
    ['threads_peak','线程数峰值'],['cpu_ms','CPU 时间','ms'],['cpu_peak','CPU 峰值','%'],['cpu_p95','CPU P95','%'],
    ['physical_p95','工作集 P95','bytes'],['heap_peak','实测堆峰值','bytes'],['native_peak','实测 JVM 原生内存峰值','bytes'],['commit_peak','提交内存峰值','bytes'],
    ['gpu_local_peak','GPU 本地内存峰值','bytes'],['gpu_shared_peak','GPU 共享内存峰值','bytes'],['gpu_combined_peak','GPU 同时用量峰值','bytes'],
    ['heap_p95','实测堆 P95','bytes'],['commit_p95','提交内存 P95','bytes'],['gpu_p95','GPU 用量 P95','bytes'],
    ['tree_working_peak','进程树工作集峰值','bytes'],['tree_process_peak','进程树数量峰值'],['io_read','读取总量','bytes'],['io_write','写入总量','bytes'],
    ['launch_window_ms','启动采样窗口','ms'],['launch_heap_peak','启动期堆峰值','bytes'],['launch_native_peak','启动期 JVM 原生内存峰值','bytes'],
    ['launch_physical_peak','启动期工作集峰值','bytes'],['launch_commit_peak','启动期提交内存峰值','bytes'],['launch_gpu_local_peak','启动期 GPU 本地内存峰值','bytes'],
    ['launch_gpu_shared_peak','启动期 GPU 共享内存峰值','bytes'],['launch_cpu_peak','启动期 CPU 峰值','%'],['launch_io_read','启动期读取量','bytes']
  ])}
];
function display(value: string | undefined, unit?: string) {
  const n = Number(value);
  if (value === undefined || value === '-1' || !Number.isFinite(n)) return ui('未采集');
  if (unit === 'bool') return ui(n ? '是' : '否');
  return `${(unit === 'bytes' ? n / 1048576 : n).toLocaleString(uiLocale.value, {maximumFractionDigits:2})}${unit ? ' ' + (unit === 'bytes' ? 'MiB' : unit) : ''}`;
}
function clearDetail() { ++detailGeneration; detail.value = undefined; detailLoading.value = false; detailError.value = ''; }
async function load() {
  const generation = ++listGeneration; loading.value = true; runs.value = []; error.value = ''; visible.value = false; clearDetail();
  try { const response = await pluginCenterApi.launcherRuns(props.days, props.version, props.os); if (generation === listGeneration) runs.value = response.runs; }
  catch { if (generation === listGeneration) error.value = '无法加载运行记录，请稍后重试。'; }
  finally { if (generation === listGeneration) loading.value = false; }
}
async function open(run: string) {
  clearDetail(); const generation = detailGeneration; visible.value = true; detailLoading.value = true;
  try { const response = await pluginCenterApi.launcherRun(run); if (generation === detailGeneration) detail.value = response; }
  catch { if (generation === detailGeneration) detailError.value = '无法加载运行详情，请稍后重试。'; }
  finally { if (generation === detailGeneration) detailLoading.value = false; }
}
watch(()=>[props.days,props.version,props.os],()=>void load(),{immediate:true});
onUnmounted(()=>{++listGeneration;clearDetail();});
</script>
<style scoped>
h3{margin:24px 0 12px;font-size:17px}p{color:var(--el-text-color-secondary);line-height:1.7}.detail{min-height:160px}
</style>
