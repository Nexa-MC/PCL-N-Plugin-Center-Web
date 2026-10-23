import { onMounted, ref, shallowRef } from 'vue';
import { ApiError, SESSION_EVENT } from '@/api/platform';
import { ui, uiLocale } from '@/languages/localize';

export function useManagement<T>(loader: () => Promise<T>) {
  const data = shallowRef<T>(), loading = ref(false), busy = ref(false), error = ref(''), success = ref('');
  let generation = 0;
  function failed(e: unknown) {
    error.value = e instanceof Error ? e.message : '请求失败，请重试。';
    if (e instanceof ApiError && [401, 403].includes(e.status)) window.dispatchEvent(new Event(SESSION_EVENT));
  }
  async function load() {
    const current = ++generation;
    loading.value = true; error.value = '';
    try { const result = await loader(); if (current === generation) data.value = result; }
    catch (e) { if (current === generation) failed(e); }
    finally { if (current === generation) loading.value = false; }
  }
  async function perform(operation: () => Promise<unknown>, message: string) {
    if (busy.value) return false;
    busy.value = true; error.value = ''; success.value = '';
    try { await operation(); success.value = message; await load(); return true; }
    catch (e) { failed(e); return false; }
    finally { busy.value = false; }
  }
  onMounted(load);
  return { data, loading, busy, error, success, load, perform };
}

export const formatDate = (value: string | null | undefined) => value ? new Date(value).toLocaleString(uiLocale.value, { timeZone: 'Asia/Shanghai', hour12: false }) : '—';
export const formatNumber = (value: number) => value.toLocaleString(uiLocale.value);
export const applicationLabel = (kind: string) => ui({ developer: '开发者', trusted_developer: '受信任开发者', admin: '网站管理员' }[kind] || kind);
