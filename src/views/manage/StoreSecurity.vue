<template>
  <section class="store-page"><div class="section-heading"><h1>{{ $ui('制品安全审核') }}</h1><div class="actions"><router-link class="secondary-button" to="/manage/store">{{ $ui('商店审核') }}</router-link><router-link class="secondary-button" to="/manage/store/finance">{{ $ui('财务申请审核') }}</router-link></div></div>
    <p>{{ $ui('疑似问题仅停止新购买；确认恶意才阻断已拥有者的加载。') }}</p>
    <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p><p v-if="message" class="form-success" role="status">{{ $ui(message) }}</p>
    <section class="work-panel"><form class="store-form" @submit.prevent="load"><label>{{ $ui('内容ID') }}<input v-model.trim="itemId" required maxlength="100" /></label><button class="secondary-button" :disabled="busy">{{ $ui('读取安全资料') }}</button></form></section>
    <section v-if="data" class="work-panel"><h2>{{ data.item.name }}</h2><p class="store-muted">{{ $ui(securityState(data.item.security_status)) }}</p>
      <form class="store-form" @submit.prevent="submit"><label>{{ $ui('审核制品') }}<select v-model="sha256" required><option value="" disabled>{{ $ui('请选择') }}</option><option v-for="release in data.releases" :key="release.id" :value="release.sha256">{{ release.version }} · {{ release.sha256.slice(0, 16) }}…</option></select></label><p class="store-hash">SHA-256 {{ sha256 }}</p>
        <label>{{ $ui('安全判定') }}<select v-model="classification" @change="confirmed = false"><option value="suspected">{{ $ui('疑似，进入人工复核') }}</option><option value="confirmed_malicious">{{ $ui('确认恶意并阻断加载') }}</option><option value="clear">{{ $ui('解除安全阻断') }}</option></select></label>
        <label>{{ $ui('审核证据与原因') }}<textarea v-model.trim="evidence" rows="5" maxlength="4000" required /></label>
        <label v-if="classification === 'confirmed_malicious'" class="security-confirm"><input v-model="confirmed" type="checkbox" required />{{ $ui('已核对证据及制品哈希，确认要求启动器停止加载。') }}</label>
        <p v-if="classification === 'clear'" class="store-muted">{{ $ui('解除安全阻断不会自动重新上架内容。') }}</p>
        <button class="primary-button" :disabled="busy || !sha256 || !evidence || (classification === 'confirmed_malicious' && !confirmed)">{{ $ui('保存安全审核') }}</button>
      </form>
    </section>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { commerce, type SecurityItem } from '@/api/commerce';
import '@/styles/store.css';
const itemId = ref(''), data = ref<SecurityItem>(), sha256 = ref(''), classification = ref<'suspected' | 'confirmed_malicious' | 'clear'>('suspected'), evidence = ref(''), confirmed = ref(false), busy = ref(false), error = ref(''), message = ref('');
const securityState = (value: string) => ({ unflagged: '未标记恶意', suspected: '疑似，等待复核', confirmed_malicious: '已确认恶意，已阻断' }[value] || value);
async function load() { if (busy.value) return; busy.value = true; error.value = ''; try { data.value = await commerce.security(itemId.value); sha256.value = data.value.releases[0]?.sha256 || ''; confirmed.value = false; } catch (e) { data.value = undefined; error.value = e instanceof Error ? e.message : '安全资料读取失败'; } finally { busy.value = false; } }
async function submit() { if (busy.value || !data.value) return; busy.value = true; error.value = ''; message.value = ''; try { await commerce.decideSecurity(data.value.item, classification.value, sha256.value, evidence.value); message.value = '安全审核已记录。'; busy.value = false; await load(); } catch (e) { error.value = e instanceof Error ? e.message : '安全审核提交失败'; } finally { busy.value = false; } }
const route = useRoute(); onMounted(() => { if (typeof route.query.item === 'string') { itemId.value = route.query.item; void load(); } });
</script>

<style scoped>
.security-confirm{display:flex;align-items:flex-start;gap:8px}.security-confirm input{width:auto;margin-top:4px}
</style>
