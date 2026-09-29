import { createRouter, createWebHistory } from 'vue-router';
import CloudShell from '@/views/cloud/CloudShell.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: CloudShell, children: [
      { path: '', component: () => import('@/views/cloud/Home.vue') },
      { path: 'store', component: () => import('@/views/cloud/Store.vue') },
      { path: 'store/:id', component: () => import('@/views/cloud/Store.vue') },
      { path: 'download', component: () => import('@/views/site/download.vue') },
      { path: 'changelog', component: () => import('@/views/site/changelog.vue') },
      { path: 'account', component: () => import('@/views/cloud/Account.vue') },
      { path: 'docs', component: () => import('@/views/cloud/Placeholder.vue'), props: { title: '文档', eyebrow: 'DOCUMENTATION', description: '' } },
      { path: 'pricing', component: () => import('@/views/cloud/Pricing.vue') },
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
    { path: '/website-management', redirect: '/account?section=website' },
    { path: '/home', redirect: '/' },
    { path: '/login', component: () => import('@/views/cloud/Login.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/cloud/NotFound.vue') }
  ]
});
router.afterEach(to => { document.title = `${to.path === '/' ? 'NexaCL' : to.path.startsWith('/account') ? '账户' : to.path.startsWith('/docs') ? '文档' : 'Nexa Cloud'} · Nexa Cloud`; });
export default router;
