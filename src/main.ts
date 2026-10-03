import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './utils/theme';
import App from './App.vue';
import router from './routers';
import i18n from './languages';
import { ui, uiLocale } from './languages/localize';
import { testLogin, testLogout } from './api/platform';
import './styles/cloud.css';
import './styles/theme.css';

// 仅前端测试账户入口：控制台输入 test_login() 进入、test_logout() 退出。
// 默认 staff + developer 全 UI 权限；数据为本地桩，不触达真实 API。
// 会话持久化在 localStorage，刷新不失效，直到 test_logout()。
declare global {
  interface Window { test_login: typeof testLogin; test_logout: typeof testLogout }
}
window.test_login = testLogin;
window.test_logout = testLogout;
if (import.meta.env.DEV) console.info(ui('提示：控制台输入 test_login() 进入全权限前端测试账户（本地持久，test_logout() 退出）。'));

const app = createApp(App).use(i18n).use(ElementPlus).use(router);
app.config.globalProperties.$ui = ui;
Object.defineProperty(app.config.globalProperties, '$locale', { get: () => uiLocale.value });
app.mount('#app');
// 首屏引导进度条交接给路由进度条
document.getElementById('boot-progress')?.remove();
