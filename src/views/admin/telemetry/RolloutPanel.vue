<template>
  <section class="rollouts" :aria-label="$ui('灰度测试')">
    <header><div><h2>{{ $ui("灰度测试") }}</h2><p>{{ $ui("分批开放更新，或试用已内置的功能。分组在设备本地完成。") }}</p></div><el-button :disabled="busy" @click="load">{{ $ui("重新读取") }}</el-button></header>
    <el-alert v-if="error" :title="$ui(error)" type="error" :closable="false" />
    <template v-if="policy">
      <p>{{ $ui("已保存第 {0} 版规则。停用或过期的更新规则会暂停推送；删除更新规则会恢复全量推送。功能规则停用后使用默认行为。", [policy.revision]) }}</p>
      <article v-for="(rule, index) in policy.rules" :key="index">
        <el-form label-position="top" :disabled="busy">
          <div class="fields">
            <el-form-item :label="$ui('分组名称（保存后保持不变）')"><el-input v-model="rule.id" :placeholder="$ui('例如 alpha-five')" :disabled="savedIds.has(rule.id)" maxlength="64" /></el-form-item>
            <el-form-item :label="$ui('类型')"><el-select v-model="rule.kind" @change="rule.target = rule.kind === 'feature' ? 'telemetry.compact-batches' : ''"><el-option :label="$ui('版本更新')" value="update" /><el-option :label="$ui('功能试验')" value="feature" /></el-select></el-form-item>
            <el-form-item v-if="rule.kind === 'update'" :label="$ui('目标版本')"><el-input v-model="rule.target" placeholder="2.0.0.alpha.5" /></el-form-item>
            <el-form-item v-else :label="$ui('功能')"><el-select v-model="rule.target"><el-option :label="$ui('使用较小的遥测批次')" value="telemetry.compact-batches" /></el-select></el-form-item>
            <el-form-item :label="$ui('通道')"><el-select v-model="rule.channels" multiple><el-option v-for="c in channels" :key="c.value" :label="$ui(c.label)" :value="c.value" /></el-select></el-form-item>
            <el-form-item :label="$ui('平台')"><el-select v-model="rule.rids" multiple><el-option v-for="r in platforms" :key="r.value" :label="r.label" :value="r.value" /></el-select></el-form-item>
            <el-form-item :label="$ui('到期时间（UTC）')"><el-input v-model="rule.expiresAt" placeholder="2026-12-01T00:00:00Z" /></el-form-item>
          </div>
          <el-form-item :label="$ui('开放比例：{0}%', [rule.basisPoints / 100])"><el-slider v-model="rule.basisPoints" :min="0" :max="10000" :step="100" :format-tooltip="(n: number) => `${n / 100}%`" /></el-form-item>
          <div class="actions"><el-switch v-model="rule.enabled" :active-text="$ui('启用')" /><el-button type="danger" plain @click="remove(index)">{{ $ui("删除规则") }}</el-button></div>
        </el-form>
      </article>
      <footer><el-button :disabled="busy || policy.rules.length >= 32" @click="add">{{ $ui("添加规则") }}</el-button><el-button type="primary" :loading="busy" @click="save">{{ $ui("保存规则") }}</el-button><span role="status">{{ $ui(status) }}</span></footer>
    </template>
  </section>
</template>
<script setup lang="ts">
import { ui } from '@/languages/localize';
import { onMounted, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { pluginCenterApi, type LauncherRolloutPolicy } from '@/api/pluginCenter';
const policy = ref<LauncherRolloutPolicy>(), savedIds = ref(new Set<string>());
const busy = ref(false), error = ref(''), status = ref('');
const channels = [{ value: 'stable', label: '正式版' }, { value: 'beta', label: 'Beta' }, { value: 'alpha', label: 'Alpha' }, { value: 'ci', label: 'CI' }];
const platforms = ['win-x64', 'win-arm64', 'osx-x64', 'osx-arm64', 'linux-x64', 'linux-arm64'].map(value => ({ value, label: value.replace('win-', 'Windows ').replace('osx-', 'macOS ').replace('linux-', 'Linux ') }));
async function load() {
  busy.value = true; error.value = ''; status.value = '';
  try { policy.value = await pluginCenterApi.launcherRollouts(); savedIds.value = new Set(policy.value.rules.map(r => r.id)); }
  catch { error.value = '无法读取灰度规则。'; } finally { busy.value = false; }
}
function add() { policy.value?.rules.push({ id: '', kind: 'update', target: '', basisPoints: 0, channels: ['alpha'], rids: platforms.map(r => r.value), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z'), enabled: false }); }
async function remove(index: number) {
  try { await ElMessageBox.confirm(ui('删除更新规则后，该版本将恢复全量推送。更改将在保存后生效。'), ui('删除规则'), { type: 'warning', confirmButtonText: ui('删除'), cancelButtonText: ui('取消') }); policy.value?.rules.splice(index, 1); } catch { /* cancelled */ }
}
async function save() {
  if (!policy.value) return;
  busy.value = true; error.value = ''; status.value = '';
  try { policy.value = await pluginCenterApi.saveLauncherRollouts(policy.value); savedIds.value = new Set(policy.value.rules.map(r => r.id)); status.value = '已保存'; }
  catch { error.value = '未保存。请检查格式；如果其他管理员已修改规则，请重新读取后再编辑。'; } finally { busy.value = false; }
}
onMounted(load);
</script>
<style scoped>
.rollouts { margin-top: 24px; padding: 24px; border: 1px solid var(--el-border-color-lighter); border-radius: 20px; background: var(--el-bg-color); }
header, footer, .actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; } h2 { margin: 0; font-size: 18px; } p, footer span { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
article { border-top: 1px solid var(--el-border-color-lighter); padding: 24px 0; } .fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 20px; } footer { justify-content: flex-start; margin-top: 20px; }
@media (max-width: 800px) { .fields { grid-template-columns: 1fr; } }
</style>
