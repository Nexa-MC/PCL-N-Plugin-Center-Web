<template>
  <section class="store-page">
    <div class="section-heading"><div><p class="eyebrow">{{ consoleOrigin(kind).replace('https://', '') }}</p><h1>{{ $ui(kind === 'plugin' ? '开发者内容控制台' : '创作者内容控制台') }}</h1></div><router-link class="secondary-button" :to="`/account?section=${kind === 'plugin' ? 'developer' : 'creator'}`">{{ $ui('返回账户概览') }}</router-link></div>
    <p v-if="checking" role="status">{{ $ui('正在检查会话…') }}</p><section v-else-if="!allowed" class="work-panel"><p>{{ $ui('当前账户没有此类内容的发布资格') }}</p><router-link to="/account">{{ $ui('我的账户') }}</router-link></section>
    <template v-else>
      <PublisherContentSummary :kind="kind" :key="summaryKey" />
      <PublisherFinance />
      <p class="store-muted">{{ $ui('真实付费与打款尚未开放；免费内容也需要账户购买取得拥有权。') }}</p>
      <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
      <section class="work-panel"><h2>{{ $ui('创建内容草稿') }}</h2><form class="store-form" @submit.prevent="create"><label>{{ $ui('名称') }}<input v-model.trim="form.name" required maxlength="120" /></label><label>{{ $ui('简介') }}<input v-model.trim="form.summary" required maxlength="400" /></label><label>{{ $ui('详细介绍') }}<textarea v-model.trim="form.description" required maxlength="12000" rows="4" /></label><label>{{ $ui('价格（整数N代币，0表示免费）') }}<input v-model.number="form.tokenPrice" type="number" min="0" max="1000000000" step="1" required /></label><button class="primary-button" :disabled="busy || testMode">{{ $ui('创建草稿') }}</button></form></section>
      <section class="work-panel"><h2>{{ $ui('提交制品与发布版本') }}</h2><p class="store-muted">{{ $ui('最近100个内容。制品上传到本站存储，不会自动上传到 VirusTotal。') }}</p>
        <form class="store-form" @submit.prevent="release"><label>{{ $ui('选择自己的内容') }}<select v-model="selectedId" :aria-label="$ui('选择自己的内容')" required><option value="" disabled>{{ $ui('请选择') }}</option><option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} · {{ $ui(storeState(item.state)) }}</option></select></label><label>{{ $ui('版本') }}<input v-model.trim="version" required maxlength="60" /></label><label>{{ $ui('制品文件（最多25MiB）') }}<input type="file" required @change="selectFile" /></label><label v-if="kind === 'plugin'">{{ $ui('已有 VirusTotal analysis ID') }}<input v-model.trim="analysisId" maxlength="256" /></label><p v-if="kind === 'plugin'" class="store-muted">{{ $ui('仅查询已有完整扫描，哈希必须匹配。缺失、报错或未完成均进入人工处理。VirusTotal 样本可能被共享；上传样本前需要单独授权。') }}</p><p v-else class="store-muted">{{ $ui('主题制品提交后等待人工审核。') }}</p><button class="primary-button" :disabled="busy || testMode || !selected || !file">{{ $ui('提交版本审核') }}</button></form>
      </section>
      <section v-if="kind === 'plugin' && selected" class="work-panel"><h2>{{ $ui('新增插件内独立商品') }}</h2><form class="store-form" @submit.prevent="createProduct"><label>{{ $ui('商品标识') }}<input v-model.trim="sku" required pattern="[a-z][a-z0-9_-]{1,63}" maxlength="64" /></label><label>{{ $ui('商品名称') }}<input v-model.trim="skuName" required maxlength="120" /></label><label>{{ $ui('价格（整数N代币，0表示免费）') }}<input v-model.number="skuPrice" type="number" min="0" max="1000000000" step="1" required /></label><p class="store-muted">{{ $ui('插件内商品为独立、不可重复消费的权益，须先拥有基础插件。权益以服务端校验结果为准。') }}</p><button class="secondary-button" :disabled="busy || testMode">{{ $ui('创建独立商品') }}</button></form><code v-if="createdProduct">{{ createdProduct }}</code></section>
      <StoreDiscountEditor v-if="selected" :item-id="selected.id" />
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { platform, isTestSession, type Session } from '@/api/platform';
import { store, consoleOrigin, storeState, type StoreContent, type StoreKind } from '@/api/store';
import PublisherContentSummary from '@/components/PublisherContentSummary.vue';
import PublisherFinance from '@/components/PublisherFinance.vue';
import StoreDiscountEditor from '@/components/StoreDiscountEditor.vue';
import '@/styles/store.css';
const route = useRoute(), router = useRouter(), kind = computed<StoreKind>(() => route.meta.storeKind === 'theme' ? 'theme' : 'plugin');
const session = ref<Session>(), checking = ref(true), busy = ref(false), error = ref(''), message = ref(''), items = ref<StoreContent[]>([]), selectedId = ref(''), summaryKey = ref(0);
const testMode = computed(() => isTestSession()), allowed = computed(() => kind.value === 'plugin' ? session.value?.developer === 1 || session.value?.trustedDeveloper === 1 : session.value?.creator === 1);
const form = reactive({ name: '', summary: '', description: '', tokenPrice: 0 }), selected = computed(() => items.value.find(item => item.id === selectedId.value));
const version = ref('1.0.0'), file = ref<File>(), analysisId = ref(''), sku = ref(''), skuName = ref(''), skuPrice = ref(0), createdProduct = ref('');
async function refresh() { items.value = (await store.summary(kind.value)).items; summaryKey.value++; }
async function perform(run: () => Promise<void>) { if (busy.value) return; busy.value = true; error.value = ''; message.value = ''; try { await run(); await refresh(); } catch (e) { error.value = e instanceof Error ? e.message : '商店操作失败，请重试'; } finally { busy.value = false; } }
function create() { void perform(async () => { const result = await store.create({ kind: kind.value, ...form }); selectedId.value = result.id; Object.assign(form, { name: '', summary: '', description: '', tokenPrice: 0 }); message.value = '内容草稿已创建。'; }); }
function selectFile(event: Event) { file.value = (event.target as HTMLInputElement).files?.[0]; }
function release() { if (!selected.value || !file.value) return; const item = selected.value, uploadFile = file.value; void perform(async () => { const artifact = await store.upload(kind.value, uploadFile); await store.release(item, artifact.id, version.value, analysisId.value || undefined); message.value = '版本已提交，发布状态以审核结果为准。'; }); }
function createProduct() { if (!selected.value) return; const id = selected.value.id; void perform(async () => { const result = await store.createProduct(id, sku.value, skuName.value, skuPrice.value); createdProduct.value = result.id; sku.value = ''; skuName.value = ''; message.value = '独立商品已创建，付费购买仍保持关闭。'; }); }
onMounted(async () => { try { session.value = await platform.session(); if (!session.value) { await router.replace({ path: '/login', query: { return: route.fullPath } }); return; } if (allowed.value) await refresh(); } catch (e) { error.value = e instanceof Error ? e.message : '内容概览读取失败'; } finally { checking.value = false; } });
</script>
