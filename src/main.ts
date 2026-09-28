import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './routers';
import i18n from './languages';
import { testLogin, testLogout } from './api/platform';
import './styles/cloud.css';

// 仅前端测试账户入口：控制台输入 test_login() 进入、test_logout() 退出。
// 只写本地 UI 状态，不签发令牌、不触达后端，刷新即失效。
declare global {
  interface Window { test_login: typeof testLogin; test_logout: typeof testLogout }
}
window.test_login = testLogin;
window.test_logout = testLogout;
console.info('提示：控制台输入 test_login() 可进入仅前端测试账户（test_logout() 退出）。');

createApp(App).use(i18n).use(ElementPlus).use(router).mount('#app');
