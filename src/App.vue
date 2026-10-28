<template><el-config-provider :locale="locale === 'en' ? en : zhCn"><router-view /></el-config-provider></template>
<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import { useI18n } from 'vue-i18n';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { uiLocale } from './languages/localize';
const { locale } = useI18n();
const route = useRoute();
watchEffect(() => {
  document.documentElement.classList.toggle('console-dashboard', /^\/(manage|publisher)(\/|$)/.test(route.path));
});
watchEffect(() => { document.documentElement.lang = uiLocale.value; });
</script>
