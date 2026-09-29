<template>
  <div class="seg-code" role="group" :aria-label="label">
    <template v-for="i in length" :key="i">
      <span v-if="groupSize && i > 1 && (i - 1) % groupSize === 0" class="seg-sep" aria-hidden="true">–</span>
      <input
        :ref="el => setBox(i - 1, el)"
        :value="chars[i - 1] ?? ''"
        :disabled="disabled"
        :inputmode="charset === 'digits' ? 'numeric' : 'text'"
        :autocomplete="i === 1 ? 'one-time-code' : 'off'"
        :aria-label="`${label} 第 ${i} 位`"
        maxlength="1"
        :class="{ filled: Boolean(chars[i - 1]) }"
        @input="onInput(i - 1, $event)"
        @keydown="onKeydown(i - 1, $event)"
        @paste="onPaste(i - 1, $event)"
        @focus="onFocus"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
// 分段验证码输入：每格一个字符，输入后自动跳到下一格；强制大写；
// 支持粘贴分发、退格回跳与方向键移动。charset=digits 仅数字，alnum 为 A–Z / 0–9。
import { computed, nextTick, onMounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  length: number;
  charset?: 'digits' | 'alnum';
  groupSize?: number;
  label: string;
  disabled?: boolean;
}>(), { charset: 'digits', groupSize: 0, disabled: false });

const emit = defineEmits<{ complete: [value: string] }>();
const model = defineModel<string>({ default: '' });

const stripPattern = computed(() => props.charset === 'digits' ? /[^0-9]/g : /[^A-Z0-9]/g);
const chars = computed(() => model.value.toUpperCase().replace(stripPattern.value, '').split(''));

const boxes: (HTMLInputElement | null)[] = [];
const setBox = (index: number, el: unknown) => { boxes[index] = el instanceof HTMLInputElement ? el : null; };
const focusBox = (index: number) => { boxes[Math.max(0, Math.min(props.length - 1, index))]?.focus(); };

function publish(next: string[]) {
  const value = next.join('').slice(0, props.length);
  model.value = value;
  if (value.length === props.length) emit('complete', value);
}

function onInput(index: number, event: Event) {
  const el = event.target as HTMLInputElement;
  const value = el.value.toUpperCase().replace(stripPattern.value, '');
  if (!value) { publish(withChar(index, '')); return; }
  if (value.length > 1) { writeFrom(index, value); return; }
  publish(withChar(index, value));
  if (index < props.length - 1) focusBox(index + 1);
}

function withChar(index: number, char: string): string[] {
  const next = Array.from({ length: props.length }, (_, i) => chars.value[i] ?? '');
  next[index] = char;
  return next;
}

function writeFrom(index: number, text: string) {
  const next = Array.from({ length: props.length }, (_, i) => chars.value[i] ?? '');
  for (let i = 0; i < text.length && index + i < props.length; i++) next[index + i] = text[i];
  publish(next);
  focusBox(Math.min(index + text.length, props.length - 1));
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    if (!chars.value[index] && index > 0) {
      event.preventDefault();
      publish(withChar(index - 1, ''));
      focusBox(index - 1);
    }
  } else if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); focusBox(index - 1); }
  else if (event.key === 'ArrowRight' && index < props.length - 1) { event.preventDefault(); focusBox(index + 1); }
}

function onPaste(index: number, event: ClipboardEvent) {
  const text = (event.clipboardData?.getData('text') ?? '').toUpperCase().replace(stripPattern.value, '');
  if (!text) return;
  event.preventDefault();
  writeFrom(index, text);
}

// 聚焦即全选，覆盖输入更顺手。
function onFocus(event: FocusEvent) {
  const el = event.target;
  if (el instanceof HTMLInputElement) el.select();
}

// 父组件清空（如验证失败）后回到第一格，方便立即重输。
watch(model, value => { if (!value) void nextTick(() => focusBox(0)); });
onMounted(() => void nextTick(() => focusBox(0)));
</script>
<style scoped>
.seg-code{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}
.seg-code input{width:44px;height:54px;text-align:center;font-size:21px;font-weight:650;font-variant-numeric:tabular-nums;text-transform:uppercase;border:1px solid #dce7ed;border-radius:10px;background:#fff;color:#2e4753;padding:0;transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}
.seg-code input.filled{border-color:#b9d3f5;background:#f7faff}
.seg-code input:focus{outline:none;border-color:var(--nc-accent);box-shadow:0 0 0 3px var(--market-accent-soft)}
.seg-code input:disabled{background:var(--market-surface-soft);color:#9aa6b8;cursor:wait}
.seg-sep{color:#9aa6b8;font-size:18px;font-weight:600;user-select:none}
@media(max-width:480px){.seg-code{gap:5px}.seg-code input{width:32px;height:44px;font-size:17px;border-radius:8px}}
@media(prefers-reduced-motion:reduce){.seg-code input{transition:none}}
</style>
