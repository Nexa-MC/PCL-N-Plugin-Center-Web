<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    align-center
    class="nexa-dialog"
    @update:model-value="(value: boolean) => { if (!busy) emit('update:modelValue', value); }"
  >
    <div ref="bodyRef" class="dialog-body">
      <p v-if="description" class="dialog-desc">{{ description }}</p>
      <slot />
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-if="hint" class="login-fine">{{ hint }}</p>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <button class="secondary-button" type="button" :disabled="busy" @click="emit('update:modelValue', false)">{{ cancelLabel }}</button>
        <button class="primary-button" type="button" :disabled="busy || !canConfirm" @click="emit('confirm')">{{ busy ? busyLabel : confirmLabel }}</button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
// 账户页统一的模态框外壳：所有“修改类”操作都通过它进入二级确认，
// 不再把编辑表单直接铺在页面里。busy 期间锁定关闭，防止请求中途逃逸。
import { nextTick, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  error?: string;
  hint?: string;
  busy?: boolean;
  busyLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  canConfirm?: boolean;
  width?: string;
  autofocus?: boolean;
}>(), {
  description: '', error: '', hint: '', busy: false, busyLabel: '处理中…',
  confirmLabel: '确认', cancelLabel: '取消', canConfirm: true,
  width: 'min(480px, calc(100vw - 32px))', autofocus: true
});
const emit = defineEmits<{ 'update:modelValue': [boolean]; confirm: [] }>();

const bodyRef = ref<HTMLDivElement>();
watch(() => props.modelValue, open => {
  if (open && props.autofocus) void nextTick(() => {
    const input = bodyRef.value?.querySelector<HTMLInputElement>('input:not([disabled]),textarea:not([disabled])');
    input?.focus();
  });
});
</script>
<style scoped>
.dialog-body{display:grid;gap:12px}
.dialog-desc{font-size:13px;color:var(--market-muted);line-height:1.8}
.dialog-footer{display:flex;justify-content:flex-end;gap:10px}
.dialog-body :deep(.form-error){margin:0}
</style>
