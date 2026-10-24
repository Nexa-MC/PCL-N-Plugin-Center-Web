<template>
  <section class="contact-page">
    <div class="section-heading"><div><p class="eyebrow">NEXA</p><h1>{{ $ui('联系我们') }}</h1></div></div>
    <p class="login-fine">{{ $ui('请选择与你的问题对应的邮箱，后续由团队通过邮件跟进。') }}</p>
    <div class="contact-grid">
      <article v-for="contact in CONTACTS" :key="contact.key" class="work-panel">
        <h2>{{ $ui(contact.label) }}</h2><p>{{ $ui(contact.description) }}</p>
        <a class="text-link" :href="`mailto:${contact.address}`">{{ contact.address }}</a>
      </article>
    </div>
    <p class="login-fine">{{ $ui('自动回执仅用于确认收件，不代表请求已处理完成。请勿发送密码、验证码或完整支付卡信息。') }}</p>
    <p class="login-fine"><router-link to="/legal/privacy">{{ $ui('隐私政策') }}</router-link> · <router-link to="/legal/refunds">{{ $ui('退款与取消政策') }}</router-link></p>
  </section>
</template>
<script setup lang="ts">
import { CONTACTS } from '@/config/contact';
</script>
<style scoped>
.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}.contact-grid h2{margin-top:0}.contact-grid p{color:var(--market-muted);line-height:1.7}.contact-grid a{overflow-wrap:anywhere}@media(max-width:640px){.contact-grid{grid-template-columns:1fr}}
</style>
