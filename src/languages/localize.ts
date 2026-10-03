import { computed } from 'vue';
import i18n from './index';
import { translateUi } from './ui';

export const uiLocale = computed(() => i18n.global.locale.value === 'en' ? 'en-US' : 'zh-CN');
export function ui(value: unknown, parameters?: readonly unknown[]): string {
  return translateUi(value, i18n.global.locale.value, parameters);
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $ui: typeof ui;
    $locale: string;
  }
}
