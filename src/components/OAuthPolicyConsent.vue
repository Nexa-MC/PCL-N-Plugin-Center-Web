<template>
  <p v-if="loading" class="login-fine" role="status">{{ $ui('正在加载协议…') }}</p>
  <p v-else-if="error" class="form-error" role="alert">{{ $ui(error) }} <button type="button" class="text-link" @click="load">{{ $ui('重试') }}</button></p>
  <label v-else-if="policies" class="accept-check">
    <input type="checkbox" :checked="!!modelValue" :disabled="disabled" @change="confirm" />
    <span>{{ $ui('我接受《') }}<a :href="documentUrl('terms', policies.terms.version)">{{ $ui('服务条款 v') }}{{ policies.terms.version }}</a>{{ $ui('》，并知悉《') }}<a :href="documentUrl('privacy', policies.privacy.version)">{{ $ui('隐私政策 v') }}{{ policies.privacy.version }}</a>{{ $ui('》') }}</span>
  </label>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { platform, POLICY_VERSION } from '@/api/platform';

defineProps<{ modelValue: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const policies = ref<Awaited<ReturnType<typeof platform.currentPolicies>>>();
const loading = ref(true), error = ref('');
// A different Auth release must link to that exact document, not the bundled current version.
const documentUrl = (kind: string, version: string) => version === POLICY_VERSION ? `/legal/${kind}` : `/legal/archive/${encodeURIComponent(version)}/${kind}.zh-CN.md`;
async function load() {
  loading.value = true; error.value = ''; policies.value = undefined;
  emit('update:modelValue', '');
  try {
    const current = await platform.currentPolicies();
    if (![current.terms?.version, current.privacy?.version].every(version => typeof version === 'string' && /^\d+\.\d+$/.test(version))) throw new Error('暂时无法读取协议版本，请重试。');
    policies.value = current;
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '暂时无法读取协议版本，请重试。'; }
  finally { loading.value = false; }
}
function confirm(event: Event) { emit('update:modelValue', (event.target as HTMLInputElement).checked ? policies.value!.terms.version : ''); }
onMounted(load);
</script>
