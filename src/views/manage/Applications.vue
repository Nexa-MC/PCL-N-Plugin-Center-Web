<template>
  <div>
    <div class="manage-page-heading"><div><span class="manage-eyebrow">{{ $ui('访问资格审核') }}</span><h1>{{ $ui("资格审批") }}</h1><p>{{ $ui("审核账户的开发者与管理员资格申请。") }}</p></div><button class="secondary-button" :disabled="loading || busy" @click="load">{{ $ui("刷新") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><p v-if="success" class="form-success" role="status">{{ $ui(success) }}</p>
    <section class="manage-panel"><div class="manage-section-heading"><h2>{{ $ui("待审申请") }}</h2><span class="manage-tag">{{ $ui("最多显示最早的 100 项") }}</span></div>
      <p v-if="loading" class="manage-empty" role="status">{{ $ui("正在读取资格申请…") }}</p>
      <div v-else-if="data?.applications.length" class="manage-table-wrap"><table class="manage-table"><thead><tr><th>{{ $ui("申请账户") }}</th><th>{{ $ui("申请资格") }}</th><th>{{ $ui("当前等级") }}</th><th>{{ $ui("提交时间") }}</th><th>{{ $ui("操作") }}</th></tr></thead><tbody><tr v-for="application in data.applications" :key="application.id"><td><strong>{{ application.user.name }}</strong><small>{{ application.user.handle || application.user.id }}</small></td><td>{{ applicationLabel(application.kind) }}</td><td>Lv{{ application.level }}</td><td>{{ formatDate(application.createdAt) }}</td><td><button class="manage-text-button" :disabled="busy" @click="openReview(application)">{{ $ui("审核申请") }}</button></td></tr></tbody></table></div>
      <div v-else-if="data" class="manage-empty"><h3>{{ $ui("暂时没有待审申请") }}</h3><p>{{ $ui("符合条件的用户提交资格申请后，会在这里等待审核。") }}</p></div>
    </section>
    <FormDialog :model-value="!!selected" :title='$ui("审核资格申请")' :busy="busy" :error="error" :confirm-label='$ui("提交审核结果")' :can-confirm="decision === 'rejected' ? !!note.trim() : canApprove" @update:model-value="selected = undefined" @confirm="review"><p>{{ $ui('{0} 申请成为{1}。', [selected?.user.name || '', applicationLabel(selected?.kind || '')]) }}</p><div v-if="selected?.eligibility" class="manage-form"><p>{{ $ui('已核验 {0} / {1} 项',[selected.eligibility.verifiedCount,selected.eligibility.required]) }}</p><ul><li v-for="condition in selected.eligibility.conditions" :key="condition.id">{{ $ui(condition.label) }} · {{ $ui(condition.met ? '已满足' : condition.available === false ? '暂未接入' : '未满足') }}<small v-if="condition.value"> · {{ condition.value }}</small></li></ul><label v-if="selected.coreContributorClaimed && !selected.eligibility.conditions.find(c=>c.id==='core')?.met"><input v-model="coreConfirmed" type="checkbox" />{{ $ui('已核实申请人为NexaCL核心贡献者，将此项计入资格条件。') }}</label></div><div class="manage-form"><label>{{ $ui("审核结果") }}<select v-model="decision"><option value="approved">{{ $ui("通过") }}</option><option value="rejected">{{ $ui("拒绝") }}</option></select></label><label>{{ $ui("审核说明") }}{{ $ui(decision === 'rejected' ? '（必填）' : '（选填）') }}<textarea v-model="note" maxlength="400" rows="3" /></label><p class="manage-muted">{{ $ui("通过申请将授予对应权限，操作会记录在审计中。不能审批自己的申请。") }}</p></div></FormDialog>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import FormDialog from '@/components/FormDialog.vue';
import { management, type Application } from '@/api/management';
import { applicationLabel, formatDate, useManagement } from './useManagement';
const coreConfirmed=ref(false);
const canApprove=computed(()=>{const e=selected.value?.eligibility;return !e || e.githubFresh && e.verifiedCount + Number(coreConfirmed.value && selected.value?.coreContributorClaimed && !e.conditions.find(c=>c.id==='core')?.met) >= e.required;});
const selected = ref<Application>(), decision = ref<'approved' | 'rejected'>('approved'), note = ref('');
const { data, loading, busy, error, success, load, perform } = useManagement(management.applications);
function openReview(application: Application) { selected.value = application; coreConfirmed.value = false; decision.value = 'approved'; note.value = ''; error.value = ''; }
async function review() { const application = selected.value; if (application && await perform(() => management.review(application, decision.value, note.value, coreConfirmed.value), '审核结果已提交。')) selected.value = undefined; }
</script>
