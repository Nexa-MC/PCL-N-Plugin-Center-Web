<template>
  <template v-if="!route.params.id">
    <section id="catalog" class="catalog-section"><div class="section-heading"><div><h1>商店</h1></div><label class="search-field"><span aria-hidden="true">⌕</span><input v-model="search" type="search" placeholder="搜索资源或发布者" aria-label="搜索资源或发布者" /></label></div>
      <div class="catalog-toolbar"><label class="category-filter">分类<select v-model="selectedCategory" aria-label="按分类筛选"><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></label><span>{{ loading ? '正在读取' : `${total} 个资源` }}</span></div>
      <div v-if="loading" class="empty-state" role="status">正在读取资源目录…</div>
      <div v-else-if="error" class="empty-state" role="alert"><span class="empty-icon">⌁</span><h3>暂时无法读取资源</h3><p>{{ error }}</p><button class="secondary-button" @click="load">重新加载</button></div>
      <div v-else-if="!filtered.length" class="empty-state"><h3>{{ search || category ? '还没有匹配的资源' : '暂无资源' }}</h3><button v-if="search || category" class="secondary-button" @click="reset">查看全部</button></div>
      <div v-else class="resource-grid"><router-link v-for="item in filtered" :key="item.id" :to="`/store/${encodeURIComponent(item.id)}`" class="resource-card"><div class="resource-art"><KoiIcon :name="item.category==='theme' ? 'gallery-edit' : item.category==='template' ? 'document' : 'code-square'" /></div><div class="resource-meta"><span>{{ item.publisher }}</span><span>免费</span></div><h3>{{ item.name }}</h3><p>{{ item.summary }}</p><footer><span>{{ item.version }}</span><span>查看资源 ↗</span></footer></router-link></div>
      <div v-if="total>50" class="pagination"><button class="secondary-button" :disabled="offset===0 || loading" @click="offset-=50;load()">上一页</button><span>{{ offset+1 }}–{{ Math.min(offset+50,total) }} / {{ total }}</span><button class="secondary-button" :disabled="offset+50>=total || loading" @click="offset+=50;load()">下一页</button></div>
    </section>
  </template>
  <section v-else class="detail-panel"><router-link to="/store" class="text-link">← 返回资源目录</router-link><p v-if="loading" role="status">正在读取…</p><p v-else-if="error" role="alert">{{ error }}</p><template v-else-if="selected"><p class="eyebrow">{{ selected.publisher }} / {{ selected.version }}</p><h1>{{ selected.name }}</h1><p class="hero-description">{{ selected.summary }}</p><p class="resource-description">{{ selected.description }}</p><button class="secondary-button" disabled>获取暂未开放</button></template><div v-else class="empty-state"><h2>资源不存在或已撤回</h2><p>已撤回的资源不会继续提供下载。</p></div></section>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { platform, type StoreItem } from '@/api/platform';
import KoiIcon from '@/components/KoiIcon.vue';
const route=useRoute(), router=useRouter(), search=ref(''), items=ref<StoreItem[]>([]), selected=ref<StoreItem>(), loading=ref(true), error=ref(''), total=ref(0), offset=ref(0);
const categories=[{id:'',name:'全部资源'},{id:'plugin',name:'插件'},{id:'theme',name:'界面资源'},{id:'template',name:'模板'}];
const category=computed(()=>String(route.query.category || ''));
const selectedCategory=computed({
  get: () => category.value,
  set: (value: string) => { void router.push({path:'/store',query:value ? {category:value} : {}}); }
});
const filtered=computed(()=>items.value);
let generation=0, timer:ReturnType<typeof setTimeout>|undefined;
async function load(){const current=++generation;loading.value=true;error.value='';try{if(route.params.id){const result=await platform.resource(String(route.params.id));if(current===generation)selected.value=result;}else{const result=await platform.catalog(new URLSearchParams({search:search.value.trim(),category:category.value,limit:'50',offset:String(offset.value)}));if(current===generation){items.value=result.data;total.value=result.pagination.total;}}}catch(e){if(current===generation){selected.value=undefined;error.value=e instanceof Error?e.message:'请稍后重试';}}finally{if(current===generation)loading.value=false;}}
function reset(){search.value='';void router.push('/store');}
watch(()=>route.fullPath,()=>{offset.value=0;void load();},{immediate:true});
watch(search,()=>{clearTimeout(timer);offset.value=0;timer=setTimeout(()=>void load(),250);});
onUnmounted(()=>{generation++;clearTimeout(timer);});
</script>
