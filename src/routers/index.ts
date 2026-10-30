import { createRouter, createWebHistory } from 'vue-router';
import { startProgress, doneProgress } from '@/utils/progressBar';
import CloudShell from '@/views/cloud/CloudShell.vue';
import { watch } from 'vue';
import { ui, uiLocale } from '@/languages/localize';
// Browsing stays public; theme installation is handed to NexaCL.
const storeView = () => import('@/views/cloud/Store.vue');
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/@:uid', component: () => import('@/views/cloud/PublicProfile.vue') },
    { path: '/people', component: () => import('@/views/cloud/PublicProfile.vue') },
    { path: '/manage', component: () => import('@/views/manage/ManagementShell.vue'), children: [
      { path: '', component: () => import('@/views/manage/Overview.vue'), meta: { title: '工作概览' } },
      { path: 'users', component: () => import('@/views/manage/Users.vue'), meta: { title: '用户管理' } },
      { path: 'resources', component: () => import('@/views/manage/Resources.vue'), meta: { title: '资源目录' } },
      { path: 'project-info', component: () => import('@/views/manage/ProjectInfoReview.vue'), meta: { title: '项目信息审核' } },
      { path: 'store', component: () => import('@/views/manage/StoreModeration.vue'), meta: { title: '商店审核' } },
      { path: 'store/finance', component: () => import('@/views/manage/StoreFinance.vue'), meta: { title: '财务申请审核' } },
      { path: 'store/security', component: () => import('@/views/manage/StoreSecurity.vue'), meta: { title: '制品安全审核' } },
      { path: 'tickets', component: () => import('@/views/manage/Tickets.vue'), meta: { title: '支持工单' } },
      { path: 'applications', component: () => import('@/views/manage/Applications.vue'), meta: { title: '资格审批' } },
      { path: 'audit', component: () => import('@/views/manage/Audit.vue'), meta: { title: '操作审计' } },
      { path: 'community', component: () => import('@/views/manage/Community.vue'), meta: { title: '公告与问卷' } },
      { path: 'telemetry', component: () => import('@/views/admin/telemetry/index.vue'), meta: { title: '启动器遥测' } }
    ] },
    { path: '/publisher', component: () => import('@/views/cloud/PublisherShell.vue'), children: [
      { path: 'plugins/new', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin', projectCreate: true } },
      { path: 'plugins/:projectId', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin' } },
      { path: 'sidecars/new', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin', projectType: 'sidecar', projectCreate: true } },
      { path: 'sidecars/:projectId', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin', projectType: 'sidecar' } },
      { path: 'themes/new', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'theme', projectCreate: true } },
      { path: 'themes/:projectId', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'theme' } },
      { path: 'plugins', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin' } },
      { path: 'sidecars', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'plugin', projectType: 'sidecar' } },
      { path: 'themes', component: () => import('@/views/cloud/PublisherConsole.vue'), meta: { storeKind: 'theme' } },
    ] },
    { path: '/', component: CloudShell, children: [
      { path: '', component: () => import('@/views/cloud/Home.vue') },
      { path: 'device', component: () => import('@/views/cloud/DeviceAuthorization.vue') },
      { path: 'store', redirect: to => to.query.category === 'theme' ? '/store/themes' : '/store/plugins' },
      { path: 'store/plugins', component: storeView, meta: { storeKind: 'plugin' } },
      { path: 'store/plugins/:id', component: storeView, meta: { storeKind: 'plugin' } },
      { path: 'store/themes', component: storeView, meta: { storeKind: 'theme' } },
      { path: 'store/themes/:id', component: storeView, meta: { storeKind: 'theme' } },
      { path: 'store/:id', redirect: to => '/store/plugins/' + encodeURIComponent(String(to.params.id)) },
      { path: 'download', component: () => import('@/views/site/download.vue') },
      { path: 'changelog', component: () => import('@/views/site/changelog.vue') },
      { path: 'account', component: () => import('@/views/cloud/Account.vue') },
      { path: 'account/delete', redirect: '/account?section=delete' },
      { path: 'docs', component: () => import('@/views/cloud/Documentation.vue') },
      { path: 'plans', component: () => import('@/views/cloud/PublicPlans.vue') },
      { path: 'pricing', component: () => import('@/views/cloud/SubscriptionPricing.vue') },
      { path: 'checkout/result', component: () => import('@/views/cloud/CheckoutResult.vue') },
      { path: 'contact', component: () => import('@/views/cloud/Contact.vue') },
      { path: 'feedback', component: () => import('@/views/cloud/Feedback.vue') },
      { path: 'welcome', component: () => import('@/views/cloud/Welcome.vue') },
      { path: 'legal', component: () => import('@/views/cloud/LegalDocs.vue') },
      { path: 'legal/:doc', component: () => import('@/views/cloud/LegalDocs.vue') },
      { path: 'console', redirect: '/account' },
      { path: 'operations', redirect: '/account' },
      { path: 'operations/telemetry', redirect: '/account?section=website' },
      { path: 'about', redirect: '/' }
    ] },
    { path: '/launcher', redirect: '/' },
    { path: '/download/thanks', component: () => import('@/views/site/download-thanks.vue') },
    { path: '/download/legacy', redirect: '/download?product=legacy' },
    { path: '/market', redirect: '/store' },
    { path: '/market/plugins/:id', redirect: to => `/store/${encodeURIComponent(String(to.params.id))}` },
    { path: '/admin/telemetry', redirect: '/account?section=website' },
    { path: '/developer', redirect: '/account?section=developer' },
    { path: '/creator', redirect: '/account?section=creator' },
    { path: '/website-management', redirect: '/account?section=website' },
    { path: '/home', redirect: '/' },
    { path: '/login', component: () => import('@/views/cloud/Login.vue') },
    { path: '/register', component: () => import('@/views/cloud/Register.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/cloud/NotFound.vue') }
  ]
});
// 统一的页面标题体系：<页面名> · NexaMC；主页使用完整品牌标题。
// 带 applyPageSeo 的页面（主页/下载/更新日志/登录/注册）会在挂载时用各自的 SEO 标题覆写。
const ROUTE_TITLES: Record<string, string> = { '/login': '登录', '/register': '创建账户', '/account': '账户', '/store': '商店', '/download': '下载', '/changelog': '更新日志', '/plans': '套餐价格', '/pricing': 'Cloud+ 订阅', '/contact': '联系我们', '/docs': '文档', '/welcome': '欢迎' };
function titleFor(path: string): string {
  if (path === '/manage' || path.startsWith('/manage/')) return ui('{0} · NexaMC 管理后台', [ui(router.currentRoute.value.meta.title || '网站管理')]);
  if (path === '/') return 'NexaMC — 一个更省心的 Minecraft 启动器';
  if (ROUTE_TITLES[path]) return `${ROUTE_TITLES[path]} · NexaMC`;
  if (path.startsWith('/legal')) return '法律文档 · NexaMC';
  if (path.startsWith('/store')) return '商店 · NexaMC';
  if (path.startsWith('/download')) return '下载 · NexaMC';
  if (path.startsWith('/account')) return '账户 · NexaMC';
  return 'NexaMC';
}
router.beforeEach(to => {
  startProgress();
  if (window.location.hostname === 'accounts.pcln.top' && to.path === '/') return '/people';
  if (window.location.hostname === 'manage.pcln.top' && to.path === '/') return '/manage';
  if (window.location.hostname === 'dev.consol.pcln.top' && to.path === '/') return '/publisher/plugins?view=overview';
  if (window.location.hostname === 'creator.consol.pcln.top' && to.path === '/') return '/publisher/themes?view=overview';
});
router.afterEach(() => { doneProgress(); });
router.onError(() => { doneProgress(); });
router.afterEach(to => { document.title = ui(titleFor(to.path)); });
watch(uiLocale, () => { document.title = ui(titleFor(router.currentRoute.value.path)); });
export default router;
