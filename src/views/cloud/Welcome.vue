<template>
  <section class="welcome-page">
    <section class="work-panel welcome-panel">
      <span class="status-pill">{{ $ui("订阅成功") }}</span>
      <h1>{{ $ui("欢迎使用 Cloud+") }}</h1>
      <p>{{ $ui("支付已完成，感谢你的支持。订阅权益通常在几分钟内同步生效；若长时间未生效，请通过账户页的支持工单联系我们。") }}</p>
      <div class="actions"><router-link class="primary-button" to="/account">{{ $ui("返回我的账户") }}</router-link><router-link class="secondary-button" to="/pricing">{{ $ui("查看其他套餐") }}</router-link></div>
      <p class="login-fine">{{ $ui("订阅与退款条款见") }} <router-link to="/legal/refunds">{{ $ui("《Nexa 退款、试用与订阅政策》") }}</router-link>{{ $ui("。") }}</p>
    </section>
  </section>
</template>
