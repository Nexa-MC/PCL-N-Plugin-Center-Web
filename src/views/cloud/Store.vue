<template>
  <section class="store-page">
    <nav class="store-switch" :aria-label="$ui('商店类型')"><router-link to="/store/plugins" :class="{ active: kind === 'plugin' }">{{ $ui('插件商店') }}</router-link><router-link to="/store/themes" :class="{ active: kind === 'theme' }">{{ $ui('主题商店') }}</router-link></nav>
    <template v-if="!id">
      <div class="section-heading"><div><p class="eyebrow">NEXASTORE</p><h1>{{ $ui(kind === 'plugin' ? '插件商店' : '主题商店') }}</h1><p class="store-muted">{{ $ui('免费内容也需登录并取得拥有权。付费购买暂未开放。') }}</p></div><label class="search-field"><input v-model="search" type="search" maxlength="120" :placeholder="$ui('搜索内容或发布者')" :aria-label="$ui('搜索内容或发布者')" /></label></div>
      <p v-if="loading" class="empty-state" role="status">{{ $ui('正在读取商店…') }}</p>
      <p v-else-if="error" class="form-error" role="alert">{{ $ui(error) }} <button class="secondary-button" @click="load">{{ $ui('重试') }}</button></p>
      <div v-else-if="!items.length" class="empty-state">{{ $ui('此商店暂时没有已上架内容。') }}</div>
      <div v-else class="resource-grid"><router-link v-for="item in items" :key="item.id" :to="storePath(kind, item.id)" class="resource-card"><div class="resource-art"><KoiIcon :name="kind === 'plugin' ? 'code-square' : 'gallery-edit'" /></div><div class="resource-meta"><span>{{ item.publisher_name }}</span><strong>{{ price(item.token_price) }}</strong></div><h2>{{ item.name }}</h2><p>{{ item.summary }}</p><footer><span>{{ $ui('{0} 人拥有', [item.owner_count]) }}</span><span v-if="item.average_score !== null">★ {{ item.average_score.toFixed(1) }}</span><span v-else>{{ $ui('评分暂未公开') }}</span></footer></router-link></div>
      <div v-if="total > 50" class="pagination"><button class="secondary-button" :disabled="offset === 0 || loading" @click="offset -= 50; load()">{{ $ui('上一页') }}</button><span>{{ offset + 1 }}–{{ Math.min(offset + 50, total) }} / {{ total }}</span><button class="secondary-button" :disabled="offset + 50 >= total || loading" @click="offset += 50; load()">{{ $ui('下一页') }}</button></div>
    </template>
    <template v-else>
      <router-link :to="storePath(kind)" class="text-link">{{ $ui('返回商店') }}</router-link>
      <p v-if="loading" class="empty-state" role="status">{{ $ui('正在读取商店…') }}</p>
      <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
      <template v-if="detail">
        <section class="work-panel"><div class="section-heading"><div><p class="eyebrow">{{ detail.item.publisher_name }} · {{ detail.item.version }}</p><h1>{{ detail.item.name }}</h1></div><span class="status-pill">{{ $ui(storeState(detail.item.state)) }}</span></div><p class="hero-description">{{ detail.item.summary }}</p><p class="store-description">{{ detail.item.description }}</p>
          <div class="store-stats"><span>{{ $ui('{0} 人拥有', [detail.item.owner_count]) }}</span><span>{{ $ui('{0} 人评分', [detail.item.rating_count]) }}</span><strong v-if="detail.item.average_score !== null">★ {{ detail.item.average_score.toFixed(1) }} / 5</strong><span v-else>{{ $ui('有效评分人数超过100后公开总评分。') }}</span></div>
          <p v-if="detail.scan" class="store-muted">{{ detail.scan.verdict === 'clean' ? $ui('已核验绑定此制品哈希的 VirusTotal 完整扫描。') : $ui('制品扫描仍需人工处理。') }} {{ $ui('未检出不代表绝对安全。') }}</p>
          <p v-if="detail.item.sha256" class="store-hash">SHA-256 {{ detail.item.sha256 }}</p>
          <p v-if="detail.item.state !== 'published'" class="form-error">{{ $ui('内容目前未上架，暂停购买与下载。') }}</p>
          <div class="store-products"><article v-for="product in detail.products" :key="product.id" class="store-product"><div><h3>{{ product.kind === 'content' ? $ui('内容拥有权') : product.name }}</h3><p>{{ price(product.token_price) }} <span v-if="product.kind === 'in_app'">· {{ $ui('插件内独立权益') }}</span></p></div><span v-if="product.owned" class="status-pill">{{ $ui('已拥有') }}</span><router-link v-else-if="!session" class="primary-button" :to="{ path: '/login', query: { return: route.fullPath } }">{{ $ui('登录后获取') }}</router-link><button v-else class="primary-button" :disabled="Boolean(busy) || product.token_price > 0 || !product.active || (product.kind === 'in_app' && !detail.owned)" @click="buy(product)">{{ $ui(product.token_price > 0 ? '付费购买暂未开放' : product.kind === 'in_app' && !detail.owned ? '请先取得基础内容' : '免费获取') }}</button></article></div>
          <div class="actions"><button v-if="detail.owned" class="primary-button" :disabled="Boolean(busy) || detail.item.state !== 'published'" @click="download">{{ $ui('下载已拥有的制品') }}</button><button class="secondary-button" :disabled="Boolean(busy)" @click="share">{{ $ui('分享') }}</button><button class="secondary-button" :disabled="!detail.owned || Boolean(busy)" @click="reportOpen = !reportOpen">{{ $ui('举报或补充信息') }}</button></div>
          <p class="store-muted">{{ $ui('安全或侵权问题无需购买：') }}<a href="mailto:security@pcln.top">{{ $ui('安全反馈') }}</a> · <a href="mailto:legal@pcln.top">{{ $ui('知识产权投诉') }}</a></p>
          <form v-if="reportOpen && detail.owned" class="store-form" @submit.prevent="report"><label>{{ $ui('举报说明') }}<textarea v-model="reportText" required maxlength="2000" rows="4" /></label><p class="store-muted">{{ $ui('每账户每内容一份举报，后续提交追加信息。有效拥有账户中30%举报后，内容下架并进入人工复核。') }}</p><button class="secondary-button" :disabled="Boolean(busy) || !reportText.trim()">{{ $ui('提交举报信息') }}</button></form>
          <p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
        </section>
        <section class="work-panel"><h2>{{ $ui('评分与评价') }}</h2><form v-if="detail.owned" class="store-form" @submit.prevent="saveReview"><label>{{ $ui('你的评分') }}<select v-model.number="score" :aria-label="$ui('你的评分')"><option v-for="value in 5" :key="value" :value="value">{{ value }} / 5</option></select></label><label>{{ $ui('评价内容') }}<textarea v-model="reviewText" maxlength="2000" rows="4" /></label><p class="store-muted">{{ $ui('每账户每内容保留一份评分，再次提交会更新原评分。') }}</p><button class="secondary-button" :disabled="Boolean(busy)">{{ $ui(detail.myReview ? '更新评分' : '提交评分') }}</button></form><p v-else class="store-muted">{{ $ui('取得内容拥有权后可评分和举报。') }}</p><div v-if="!reviews.length" class="store-muted">{{ $ui('暂无评价。') }}</div><article v-for="review in reviews" :key="review.author_name + review.created_at" class="store-review"><strong>{{ review.author_name }}</strong><span>★ {{ review.score }} / 5</span><p>{{ review.body }}</p><small>{{ new Date(review.updated_at).toLocaleDateString($locale) }}</small></article></section>
      </template>
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { platform, type Session } from '@/api/platform';
import { store, storePath, storeState, type StoreContent, type StoreDetail, type StoreKind, type StoreProduct, type StoreReview } from '@/api/store';
import { ui } from '@/languages/localize';
import KoiIcon from '@/components/KoiIcon.vue';
import '@/styles/store.css';
const route = useRoute(), kind = computed<StoreKind>(() => route.meta.storeKind === 'theme' ? 'theme' : 'plugin'), id = computed(() => String(route.params.id || ''));
const session = ref<Session>(), search = ref(''), items = ref<StoreContent[]>([]), detail = ref<StoreDetail>(), reviews = ref<StoreReview[]>([]), offset = ref(0), total = ref(0), loading = ref(false), error = ref(''), busy = ref(''), message = ref('');
const score = ref(5), reviewText = ref(''), reportText = ref(''), reportOpen = ref(false), keys = new Map<string, string>();
const price = (value: number) => value === 0 ? ui('免费') : ui('{0} N代币', [value.toLocaleString()]);
let generation = 0, timer: ReturnType<typeof setTimeout> | undefined;
async function load() { const current = ++generation; loading.value = true; error.value = ''; try {
  session.value = await platform.session();
  if (id.value) { const [value, comments] = await Promise.all([store.detail(id.value), store.reviews(id.value)]); if (current !== generation) return; if (value.item.kind !== kind.value) throw new Error('商店内容不存在'); detail.value = value; reviews.value = comments.data; score.value = value.myReview?.score || 5; reviewText.value = value.myReview?.body || ''; }
  else { const page = await store.catalog(kind.value, search.value.trim(), offset.value); if (current !== generation) return; items.value = page.data; total.value = page.pagination.total; }
} catch (e) { if (current === generation) { detail.value = undefined; error.value = e instanceof Error ? e.message : '商店操作失败，请重试'; } } finally { if (current === generation) loading.value = false; } }
async function action(name: string, run: () => Promise<void>) { if (busy.value) return; busy.value = name; error.value = ''; message.value = ''; try { await run(); } catch (e) { error.value = e instanceof Error ? e.message : '商店操作失败，请重试'; } finally { busy.value = ''; } }
function buy(product: StoreProduct) { void action('purchase', async () => { const key = keys.get(product.id) || Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join(''); keys.set(product.id, key); await store.purchase(product, key); await load(); message.value = '已取得内容拥有权。'; }); }
function saveReview() { void action('review', async () => { await store.review(id.value, score.value, reviewText.value); await load(); message.value = '评分已保存。'; }); }
function report() { void action('report', async () => { await store.report(id.value, reportText.value); reportText.value = ''; reportOpen.value = false; await load(); message.value = '举报信息已记录；重复提交会补充原举报。'; }); }
function download() { void action('download', async () => { const result = await store.download(id.value), url = URL.createObjectURL(result.blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }); }
function share() { void action('share', async () => { const url = 'https://pcln.top' + storePath(kind.value, id.value); if (navigator.share) await navigator.share({ title: detail.value?.item.name, url }); else { await navigator.clipboard.writeText(url); message.value = '分享链接已复制。'; } }); }
watch(() => route.fullPath, () => { detail.value = undefined; keys.clear(); reportOpen.value = false; message.value = ''; offset.value = 0; void load(); }, { immediate: true });
watch(search, () => { clearTimeout(timer); offset.value = 0; timer = setTimeout(() => void load(), 250); });
onUnmounted(() => { generation++; clearTimeout(timer); });
</script>
