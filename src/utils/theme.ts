import { ref } from 'vue';
export type ThemePreference = 'system' | 'light' | 'dark';
const key = 'nexa:theme';
const system = window.matchMedia('(prefers-color-scheme: dark)');
const isPreference = (value: unknown): value is ThemePreference => ['system', 'light', 'dark'].includes(String(value));
function storedTheme(): ThemePreference { try { const value = localStorage.getItem(key); return isPreference(value) ? value : 'system'; } catch { return 'system'; } }
export const themePreference = ref<ThemePreference>(storedTheme());
function applyTheme() { const dark = themePreference.value === 'dark' || (themePreference.value === 'system' && system.matches); document.documentElement.classList.toggle('dark', dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; }
export function setTheme(value: ThemePreference) { themePreference.value = value; try { localStorage.setItem(key, value); } catch { /* 私密模式仍允许本次切换 */ } applyTheme(); }
system.addEventListener('change', applyTheme);
window.addEventListener('storage', event => { if (event.key === key) { themePreference.value = storedTheme(); applyTheme(); } });
applyTheme();
