import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './routers';
import i18n from './languages';
import { testLogin, testLogout } from './api/platform';
import './styles/cloud.css';

// 仅前端测试账户入口：控制台输入 test_login() 进入、test_logout() 退出。
// 默认 staff + developer 全 UI 权限；数据为本地桩，不触达真实 API。
// 会话持久化在 localStorage，刷新不失效，直到 test_logout()。
declare global {
  interface Window { test_login: typeof testLogin; test_logout: typeof testLogout }
}
window.test_login = testLogin;
window.test_logout = testLogout;
console.info('提示：控制台输入 test_login() 进入全权限前端测试账户（本地持久，test_logout() 退出）。');

createApp(App).use(i18n).use(ElementPlus).use(router).mount('#app');
// 首屏引导进度条交接给路由进度条
document.getElementById('boot-progress')?.remove();
