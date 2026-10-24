<template>
  <section class="work-panel"><div class="section-heading"><h2>{{ $ui('商品折扣') }}</h2><button class="secondary-button" :disabled="busy" @click="load">{{ $ui('读取商品') }}</button></div>
    <p class="store-muted">{{ $ui('折扣价使用整数N代币；已完成订单保留原实付金额。') }}</p><p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
    <form v-if="products.length" class="store-form" @submit.prevent="save(false)"><label>{{ $ui('选择商品') }}<select v-model="productId" @change="price = selected?.token_price || 0"><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }} · {{ product.sku }}</option></select></label>
      <p v-if="selected">{{ $ui('原价') }}：{{ selected.regular_token_price ?? selected.token_price }} N · {{ $ui('当前售价') }}：{{ selected.token_price }} N</p>
      <label>{{ $ui('折扣价（整数N代币）') }}<input v-model.number="price" type="number" min="0" :max="selected?.regular_token_price ?? selected?.token_price ?? 0" step="1" required /></label>
      <div class="actions"><button class="primary-button" :disabled="busy || !selected">{{ $ui('保存折扣') }}</button><button class="secondary-button" type="button" :disabled="busy || !selected" @click="save(true)">{{ $ui('取消折扣') }}</button></div>
    </form><p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { store, type StoreProduct } from '@/api/store';
import { commerce } from '@/api/commerce';
const props = defineProps<{ itemId: string }>(), products = ref<StoreProduct[]>([]), productId = ref(''), price = ref(0), busy = ref(false), error = ref(''), message = ref('');
const selected = computed(() => products.value.find(product => product.id === productId.value));
async function load() { if (busy.value) return; busy.value = true; error.value = ''; try { products.value = (await store.detail(props.itemId)).products; if (!products.value.some(product => product.id === productId.value)) productId.value = products.value[0]?.id || ''; price.value = selected.value?.token_price || 0; } catch (e) { error.value = e instanceof Error ? e.message : '商品读取失败'; } finally { busy.value = false; } }
async function save(clear: boolean) { if (busy.value || !selected.value) return; busy.value = true; error.value = ''; message.value = ''; try { const updated = await commerce.discount(selected.value, clear ? null : price.value); products.value = products.value.map(product => product.id === updated.id ? updated : product); price.value = updated.token_price; message.value = '商品折扣已保存。'; } catch (e) { error.value = e instanceof Error ? e.message : '折扣保存失败'; } finally { busy.value = false; } }
watch(() => props.itemId, () => { products.value = []; productId.value = ''; error.value = ''; message.value = ''; });
</script>
