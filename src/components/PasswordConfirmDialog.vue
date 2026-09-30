<template>
  <FormDialog
    :model-value="modelValue"
    :title="titleText"
    :description="description"
    :error="error"
    :busy="busy"
    :busy-label="busyLabel"
    :confirm-label="confirmText"
    :can-confirm="valid"
    @update:model-value="value => emit('update:modelValue', value)"
    @confirm="submit"
  >
    <form class="stack-form" @submit.prevent="submit">
      <label v-if="requireCurrent">当前密码<input v-model="current" type="password" autocomplete="current-password" required placeholder="用于身份复核" /></label>
      <label v-if="mode !== 'reauth'">新密码<input v-model="next" type="password" autocomplete="new-password" minlength="14" maxlength="256" required /></label>
    </form>
    <p v-if="mode !== 'reauth'" class="login-fine">密码 14–256 位；密码登录强制两步验证。</p>
  </FormDialog>
</template>
<script setup lang="ts">
// 统一的密码验证框架：账户页所有需要密码的操作（敏感操作复核 / 设置密码 / 修改密码）
// 都收敛到这一个对话框，由调用方注入异步动作，错误就地展示、成功才关闭。
import { computed, ref, watch } from 'vue';
import FormDialog from './FormDialog.vue';

interface PasswordConfirmPayload { password?: string; newPassword?: string }

const props = withDefaults(defineProps<{
  modelValue: boolean;
  mode: 'reauth' | 'set' | 'change';
  title?: string;
  description?: string;
  busy?: boolean;
  error?: string;
  requireCurrent?: boolean;
}>(), { title: '', description: '', busy: false, error: '', requireCurrent: undefined });

const emit = defineEmits<{ 'update:modelValue': [boolean]; confirm: [payload: PasswordConfirmPayload] }>();

const current = ref(''), next = ref('');
const requireCurrent = computed(() => props.requireCurrent ?? props.mode !== 'set');
const titleText = computed(() => props.title || (props.mode === 'set' ? '设置登录密码' : props.mode === 'change' ? '修改登录密码' : '身份复核'));
const confirmText = computed(() => props.mode === 'reauth' ? '验证并继续' : props.mode === 'set' ? '设置密码' : '保存新密码');
const busyLabel = computed(() => props.mode === 'reauth' ? '正在验证…' : '正在保存…');
const valid = computed(() => {
  if (requireCurrent.value && !current.value) return false;
  if (props.mode !== 'reauth' && next.value.length < 14) return false;
  return true;
});

watch(() => props.modelValue, open => { if (open) { current.value = ''; next.value = ''; } });

function submit() {
  if (props.busy || !valid.value) return;
  emit('confirm', {
    ...(requireCurrent.value ? { password: current.value } : {}),
    ...(props.mode !== 'reauth' ? { newPassword: next.value } : {})
  });
}
</script>
<style scoped>
.stack-form{display:grid;gap:12px}
.stack-form label{display:grid;gap:8px;font-size:12px;color:#708693}
.stack-form input{padding:10px 12px;border:1px solid #dce7ed;border-radius:6px;color:#355260;background:#fff;width:100%}
.login-fine{font-size:11px;color:#9aa6b8;line-height:1.7;margin:0}
</style>
