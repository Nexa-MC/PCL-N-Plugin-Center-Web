<template>
  <section class="runs" :aria-busy="loading">
    <header><div><h2>{{ $ui("游戏运行分析") }}</h2><p>{{ $ui("按启动环境汇总资源占用与模组使用情况。") }}</p></div><el-button :loading="loading" @click="load">{{ $ui("刷新") }}</el-button></header>
    <el-alert v-if="error" :title="$ui(error)" type="error" :closable="false"/>
    <el-empty v-if="!loading && !data?.groups.length" :description="$ui('尚无可汇总的运行数据')"/>
    <template v-if="data?.groups.length">
      <h3>{{ $ui("启动环境与资源") }}</h3>
      <p>{{ $ui("每次运行先取已收到的工作集峰值，再按环境求均值。未收到退出样本的运行可能不完整。") }}</p>
      <el-table :data="data.groups"><el-table-column :label="$ui('环境')" min-width="210"><template #default="{row}">{{ row.version }} · {{ row.os }} · {{ row.loader }}</template></el-table-column><el-table-column prop="runs" :label="$ui('运行次数')" width="110"/><el-table-column :label="$ui('收到退出')" width="110"><template #default="{row}">{{ row.ended }} / {{ row.runs }}</template></el-table-column><el-table-column :label="$ui('平均峰值')" width="150"><template #default="{row}">{{ mib(row.peak) }}</template></el-table-column></el-table>
      <h3>{{ $ui("设置与资源占用") }}</h3>
      <p>{{ $ui("至少 5 次运行才展示；均值按有效采样数加权。不同配置的占用差异不代表设置变化的因果效果。") }}</p>
      <el-table :data="data.settings" :empty-text="$ui('样本尚不足')"><el-table-column prop="loader" :label="$ui('加载器')"/><el-table-column prop="render" :label="$ui('视距')"/><el-table-column prop="simulation" :label="$ui('模拟距离')"/><el-table-column prop="runs" :label="$ui('运行次数')"/><el-table-column :label="$ui('工作集均值')"><template #default="{row}">{{ mib(row.working) }}</template></el-table-column></el-table>
      <h3>{{ $ui("常见模组版本") }}</h3>
      <p>{{ $ui("按包含该模组的运行次数去重汇总，展示至少出现 5 次的前 20 项。模组声明不等于运行时已加载或兼容性已验证。") }}</p>
      <el-table :data="data.mods" :empty-text="$ui('样本尚不足')"><el-table-column prop="id" :label="$ui('模组')" min-width="190"/><el-table-column prop="version" :label="$ui('版本')"/><el-table-column prop="runs" :label="$ui('运行次数')"/></el-table>
      <p class="note">{{ $ui("环境最多展示前 40 组，设置最多展示前 20 组。缺失值保留为空，不计作零。") }}</p>
    </template>
  </section>
</template>
<script setup lang="ts">
import { ui, uiLocale } from '@/languages/localize';
import {onUnmounted,ref,watch} from 'vue';
import {pluginCenterApi} from '@/api/pluginCenter';
const props=defineProps<{days:number;version:string;os:string}>();
const data=ref<Awaited<ReturnType<typeof pluginCenterApi.launcherRunSummary>>>(),loading=ref(false),error=ref('');
let generation=0;
const mib=(value:number|null)=>value===null||!Number.isFinite(value)?ui('未采集'):`${Math.round(value).toLocaleString(uiLocale.value)} MiB`;
async function load(){const id=++generation;loading.value=true;error.value='';try{const result=await pluginCenterApi.launcherRunSummary(props.days,props.version,props.os);if(id===generation)data.value=result;}catch{if(id===generation){data.value=undefined;error.value='无法加载运行分析，请稍后重试。';}}finally{if(id===generation)loading.value=false;}}
watch(()=>[props.days,props.version,props.os],()=>{data.value=undefined;void load();},{immediate:true});
onUnmounted(()=>generation++);
</script>
<style scoped>
.runs{padding:28px;border:1px solid var(--el-border-color-lighter);border-radius:24px;background:var(--el-bg-color);color:var(--el-text-color-primary)}header{display:flex;align-items:center;justify-content:space-between;gap:20px}h2{margin:0;font-size:22px;letter-spacing:-.02em}h3{margin:32px 0 8px;font-size:17px}p{color:var(--el-text-color-secondary);font-size:13px;line-height:1.7}.note{margin-top:24px}@media(max-width:640px){.runs{padding:18px}header{align-items:flex-start}}
</style>
