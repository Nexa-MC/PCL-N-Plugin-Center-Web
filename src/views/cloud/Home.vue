<template>
  <div ref="root" class="home-page">
    <!-- ============ HERO ============ -->
    <section class="hero-card">
      <p class="hero-badge hero-anim d1"><i aria-hidden="true"></i>{{ c.hero.badge }}</p>
      <h1 class="hero-anim d2">{{ c.hero.title }}</h1>
      <p class="hero-sub hero-anim d3">{{ c.hero.sub }}</p>
      <div class="hero-actions hero-anim d4">
        <router-link class="hero-btn hero-btn-solid" to="/download">{{ c.hero.download }} <KoiIcon name="arrow-down" /></router-link>
        <router-link class="hero-btn hero-btn-ghost" to="/changelog">{{ c.hero.changelog }} <span aria-hidden="true">›</span></router-link>
      </div>
      <p class="hero-version hero-anim d5" v-if="latestVersion">{{ c.hero.build }} <code>{{ latestVersion }}</code> · {{ c.hero.platforms }}</p>
      <div class="product-stage hero-anim d6">
        <div class="product-window" role="img" :aria-label="c.window.aria">
          <div class="window-caption"><span><img src="/pcln.png" alt="">NexaCL</span><span class="window-controls" aria-hidden="true">−　□　×</span></div>
          <div class="window-body"><div class="window-rail" aria-hidden="true"><span class="active"><KoiIcon name="video-play" /></span><span><KoiIcon name="grid-equal" /></span><span><KoiIcon name="folder" /></span><span><KoiIcon name="setting" /></span></div>
            <div class="window-account"><div class="mock-label">{{ c.window.profile }}<span>＋</span></div><div class="player-mark" aria-hidden="true"><span></span><i></i></div><strong>Player</strong><small>{{ c.window.offline }}</small><div class="mock-chip">{{ c.window.switchProfile }}　⌄</div></div>
            <div class="window-right"><div class="window-version"><div class="mock-label">{{ c.window.version }}<span>☷</span></div><div class="version-detail"><div class="grass-block" aria-hidden="true"><KoiIcon name="landscape" /></div><div><strong>1.21.1</strong><small>Minecraft Java Edition</small></div><span>›</span></div><div class="mock-launch">▷　{{ c.window.launch }}</div></div><div class="window-about"><span class="about-mark">N</span><div><strong>NexaCL</strong><p>{{ c.window.tagline }}</p></div></div></div>
          </div>
        </div>
        <p class="product-caption">{{ c.window.caption }}</p>
      </div>
    </section>

    <!-- ============ AT A GLANCE ============ -->
    <section class="home-section stats reveal" :aria-label="c.stats.aria">
      <div class="stats-strip work-panel">
        <div v-for="item in c.stats.items" :key="item.value" class="stat"><b :data-count="item.value">0</b><span>{{ item.label }}</span></div>
      </div>
    </section>

    <!-- ============ WHAT NEXACL DOES FOR YOU ============ -->
    <section class="home-section reveal">
      <div class="section-head center"><p class="eyebrow">{{ c.features.eyebrow }}</p><h2>{{ c.features.title }}</h2><p>{{ c.features.sub }}</p></div>
      <div class="bento stagger">
        <article class="work-panel tile t-launch">
          <div class="launch-steps" aria-hidden="true"><template v-for="(step, index) in c.features.launch.steps" :key="step"><i v-if="index > 0">›</i><span>{{ step }}</span></template></div>
          <div class="tile-icon"><KoiIcon name="video-play" /></div><h3>{{ c.features.launch.title }}</h3>
          <p>{{ c.features.launch.body }}</p>
        </article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="coffee" /></div><h3>{{ c.features.java.title }}</h3><p>{{ c.features.java.body }}</p></article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="arrow-down" /></div><h3>{{ c.features.downloads.title }}</h3><p>{{ c.features.downloads.body }}</p></article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="refresh-arrow" /></div><h3>{{ c.features.updates.title }}</h3><p>{{ c.features.updates.body }}</p></article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="profile-circle" /></div><h3>{{ c.features.accounts.title }}</h3><p>{{ c.features.accounts.body }}</p></article>
        <article class="work-panel tile t-drop">
          <div class="tile-icon"><KoiIcon name="folder-cloud" /></div><h3>{{ c.features.install.title }}</h3>
          <p>{{ c.features.install.body }}</p>
          <div class="chip-row"><span v-for="chip in c.features.install.chips" :key="chip">{{ chip }}</span></div>
        </article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="grid-equal" /></div><h3>{{ c.features.mods.title }}</h3><p>{{ c.features.mods.body }}</p></article>
        <article class="work-panel tile"><div class="tile-icon"><KoiIcon name="recovery-convert" /></div><h3>{{ c.features.recovery.title }}</h3><p>{{ c.features.recovery.body }}</p></article>
      </div>
    </section>

    <!-- ============ PLATFORMS ============ -->
    <section class="home-section platform-card work-panel reveal" :aria-label="c.platforms.aria">
      <div><p class="platform-title">{{ c.platforms.title }}</p><small>{{ c.platforms.formats }}</small></div>
      <div class="platform-names"><span>Windows</span><span>macOS</span><span>Linux</span></div>
      <p class="platform-sign"><span class="status-pill">SHA256</span><span class="status-pill">{{ c.platforms.gpg }}</span>{{ c.platforms.sign }}</p>
    </section>

    <!-- ============ TRUST ============ -->
    <section class="home-section reveal">
      <div class="section-head center"><p class="eyebrow">{{ c.trust.eyebrow }}</p><h2>{{ c.trust.title }}</h2><p>{{ c.trust.sub }}</p></div>
      <div class="trust-grid stagger">
        <article class="work-panel"><div class="tile-icon"><KoiIcon name="shield-tick" /></div><h3>{{ c.trust.items[0].title }}</h3><p>{{ c.trust.items[0].body }}</p></article>
        <article class="work-panel"><div class="tile-icon"><KoiIcon name="lock-circle" /></div><h3>{{ c.trust.items[1].title }}</h3><p>{{ c.trust.items[1].body }}</p></article>
        <article class="work-panel"><div class="tile-icon"><KoiIcon name="code-square" /></div><h3>{{ c.trust.items[2].title }}</h3><p>{{ c.trust.items[2].body }}</p></article>
      </div>
    </section>

    <!-- ============ WHICH VERSION ============ -->
    <section class="home-section alpha-row reveal">
      <article class="work-panel alpha-progress"><span class="status-pill">{{ c.status.badge }}</span><h2>{{ c.status.title }}</h2><p>{{ c.status.body }}</p>
        <ul class="progress-list">
          <li v-for="row in c.status.rows" :key="row.label"><span>{{ row.label }}</span><b :class="row.state">{{ row.text }}</b></li>
        </ul>
        <a class="text-link" :href="NEXA_GITHUB + '/issues'" target="_blank" rel="noreferrer">{{ c.status.feedback }} ↗</a>
      </article>
      <article class="work-panel legacy-note"><span class="legacy-tag">{{ c.legacy.tag }}</span><h3>{{ c.legacy.title }}</h3><p>{{ c.legacy.body }}</p><router-link class="text-link" to="/download?product=legacy">{{ c.legacy.link }} ›</router-link></article>
    </section>

    <!-- ============ FAQ ============ -->
    <section class="home-section reveal">
      <div class="section-head center"><p class="eyebrow">{{ c.faq.eyebrow }}</p><h2>{{ c.faq.title }}</h2></div>
      <div class="faq-list work-panel">
        <details v-for="item in c.faq.items" :key="item.q" class="faq-item"><summary>{{ item.q }}</summary><p>{{ item.a }}</p></details>
      </div>
    </section>

    <!-- ============ FINAL CTA ============ -->
    <section class="home-section final-cta reveal">
      <div class="cta-panel">
        <p class="eyebrow">{{ c.cta.eyebrow }}</p>
        <h2>{{ c.cta.title }}</h2>
        <p>{{ c.cta.body }}</p>
        <div class="cta-actions">
          <router-link class="primary-button hero-cta" to="/download">{{ c.cta.download }} <KoiIcon name="arrow-down" /></router-link>
          <router-link class="secondary-button hero-cta" to="/download?product=legacy">{{ c.cta.legacy }}</router-link>
        </div>
        <p class="cta-fine">{{ c.cta.fine }} · Apache-2.0 · <a :href="NEXA_GITHUB" target="_blank" rel="noreferrer">GitHub ↗</a></p>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { NEXA_GITHUB, loadNexaCatalog } from '@/utils/nexaReleases';
import KoiIcon from '@/components/KoiIcon.vue';
import { applyPageSeo } from '@/utils/seo';
import { homeCopy } from './homeContent';
const { locale } = useI18n();
// All visible copy lives in homeContent.ts (en + zh-CN share one type).
const c = computed(() => homeCopy(locale.value));
// Show the newest published build when the catalog is reachable; stay quiet otherwise.
const latestVersion = ref('');
const controller = new AbortController();
// Scroll reveal + stat count-up, both disabled under prefers-reduced-motion.
const root = ref<HTMLElement>();
let observer: IntersectionObserver | undefined;
function countUp(el: HTMLElement, target: number) {
  const duration = 750; const started = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
onMounted(() => {
  loadNexaCatalog(controller.signal)
    .then(catalog => { latestVersion.value = (catalog.releases[0]?.tag_name ?? '').replace(/^v/, ''); })
    .catch(() => { /* Snapshot or GitHub unavailable — the hero simply omits the build tag. */ });
  if (!root.value) return;
  const nodes = root.value.querySelectorAll<HTMLElement>('.reveal');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver === 'undefined') {
    nodes.forEach(node => { node.classList.add('in'); node.querySelectorAll<HTMLElement>('[data-count]').forEach(b => { b.textContent = b.dataset.count ?? '0'; }); });
    return;
  }
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('in');
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(b => countUp(b, Number(b.dataset.count ?? 0)));
      observer?.unobserve(el);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  nodes.forEach(node => observer?.observe(node));
});
onBeforeUnmount(() => { controller.abort(); observer?.disconnect(); });
watchEffect(() => { applyPageSeo({ title: c.value.seo.title, description: c.value.seo.description, path: '/' }); document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'; });
</script>
<style scoped>
.home-page{max-width:1080px;margin:0 auto}
/* --- motion system (globally disabled under prefers-reduced-motion) --- */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .55s ease,transform .55s ease}.reveal.in{opacity:1;transform:none}
.stagger>*{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease}.in .stagger>*,.stagger.in>*{opacity:1;transform:none}
.stagger>*:nth-child(2){transition-delay:.06s}.stagger>*:nth-child(3){transition-delay:.12s}.stagger>*:nth-child(4){transition-delay:.18s}.stagger>*:nth-child(5){transition-delay:.24s}.stagger>*:nth-child(6){transition-delay:.3s}.stagger>*:nth-child(n+7){transition-delay:.36s}
@keyframes hero-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hero-anim{animation:hero-rise .6s cubic-bezier(.22,.8,.32,1) both}.hero-anim.d1{animation-delay:.02s}.hero-anim.d2{animation-delay:.08s}.hero-anim.d3{animation-delay:.15s}.hero-anim.d4{animation-delay:.22s}.hero-anim.d5{animation-delay:.29s}.hero-anim.d6{animation-delay:.36s;animation-duration:.8s}
/* --- hero --- */
.hero-card{position:relative;overflow:hidden;text-align:center;color:var(--market-text);border-radius:22px;padding:58px 40px 40px;background:var(--market-surface);border:1px solid var(--market-border);box-shadow:0 18px 44px -26px rgba(23,43,77,.22)}
.hero-card:before{content:'';position:absolute;inset:0;background:radial-gradient(620px 320px at 22% -5%,rgba(91,161,245,.14),transparent 62%);pointer-events:none;animation:hero-sheen 9s ease-in-out infinite alternate}
@keyframes hero-sheen{from{transform:translateX(-5%)}to{transform:translateX(5%)}}
.hero-badge{position:relative;display:inline-flex;align-items:center;gap:8px;background:var(--market-accent-soft);border:1px solid #c9ddf8;color:var(--nc-accent);padding:6px 15px;border-radius:999px;font-size:11px;font-weight:650;letter-spacing:.08em}
.hero-badge i{width:6px;height:6px;border-radius:50%;background:#2fa96b;animation:badge-pulse 2.4s ease-in-out infinite}
@keyframes badge-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
.hero-card h1{position:relative;font-size:40px;font-weight:700;letter-spacing:-.025em;line-height:1.25;margin:20px auto 0;max-width:720px;text-wrap:balance}
.hero-sub{position:relative;font-size:14.5px;line-height:1.9;color:var(--market-muted);max-width:620px;margin:16px auto 0}
.hero-actions{position:relative;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.hero-btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:12px 26px;font-size:14px;font-weight:600;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.hero-btn:hover{transform:translateY(-1px)}.hero-btn:active{transform:scale(.97)}
.hero-btn-solid{background:var(--nc-accent);color:#fff;box-shadow:0 10px 26px rgba(22,115,230,.30)}.hero-btn-solid:hover{background:var(--nc-accent-strong);box-shadow:0 14px 32px rgba(22,115,230,.38)}
.hero-btn-ghost{background:var(--market-surface);border:1px solid #dbe2ee;color:#43536b}.hero-btn-ghost:hover{border-color:var(--nc-accent);color:var(--nc-accent)}
.hero-version{position:relative;margin:20px 0 0;font-size:12px;color:var(--market-muted)}
.hero-version code{background:var(--market-surface-soft);border:1px solid var(--market-border);color:var(--nc-accent);padding:2px 10px;border-radius:999px;font-size:11.5px;margin:0 4px}
.product-stage{position:relative;padding:42px 0 6px;margin:auto;max-width:880px}
.product-window{border-radius:16px;background:#f8faff;border:1px solid #dce7f6;box-shadow:0 30px 55px -30px rgba(48,78,118,.35),0 4px 16px rgba(48,78,118,.10);overflow:hidden;text-align:left;color:#1e3350}
.window-caption{height:46px;background:var(--nc-accent);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:0 18px;font-size:15px;font-weight:600}
.window-caption>span{display:flex;align-items:center;gap:9px}.window-caption img{width:21px;height:21px}.window-controls{font-weight:400;opacity:.85}
.window-body{display:grid;grid-template-columns:46px .8fr 1.2fr;gap:16px;padding:20px 20px 20px 0;height:330px}
.window-rail{display:flex;align-items:center;flex-direction:column;gap:22px;color:#5e718a;font-size:20px}.window-rail .active{color:#1673e6}
.window-account,.window-version,.window-about{border:1px solid #e5eaf3;border-radius:14px;background:#fff}
.window-account{display:flex;align-items:center;flex-direction:column;padding:16px}
.mock-label{display:flex;justify-content:space-between;width:100%;font-size:12.5px;color:#617188}.mock-label span{color:#1673e6}
.player-mark{width:48px;height:48px;background:#bd9676;margin:26px 0 12px;position:relative;border-top:15px solid #493a32;border-bottom:11px solid #77583f}
.player-mark span,.player-mark i{position:absolute;top:7px;width:10px;height:6px;background:#4c7c92}.player-mark span{left:6px}.player-mark i{right:6px}
.window-account strong{font-size:19px}.window-account small{color:#67798d;font-size:12px}
.mock-chip{margin-top:16px;border-radius:40px;background:#e8f0fe;color:#0f5ecb;font-size:12px;padding:5px 13px}
.window-right{display:grid;grid-template-rows:1.65fr 1fr;gap:14px}.window-version{padding:16px}
.version-detail{display:flex;gap:12px;align-items:center;margin:13px 0}.version-detail strong{font-size:17px}.version-detail small{display:block;color:#6d7d90;font-size:11px}.version-detail>span:last-child{margin-left:auto;color:#8094ac}
.grass-block{color:#56814c;font-size:29px}
.mock-launch{background:#1673e6;border-radius:10px;text-align:center;padding:8px;color:#fff;font-size:14px;animation:launch-pulse 3.2s ease-in-out infinite}
@keyframes launch-pulse{0%,100%{box-shadow:0 0 0 0 rgba(22,115,230,.35)}55%{box-shadow:0 0 0 7px rgba(22,115,230,0)}}
.window-about{display:flex;align-items:center;gap:15px;padding:18px}.about-mark{font-size:30px;color:#1673e6;font-weight:650}.window-about p{font-size:12px;color:#748196;margin-top:3px}
.product-caption{color:var(--market-muted);font-size:11px;margin-top:14px}
/* --- sections --- */
.home-section{margin-top:56px}.section-head{max-width:660px;margin-bottom:26px}.section-head.center{text-align:center;margin-inline:auto}.section-head h2{font-size:24px;font-weight:700;letter-spacing:-.015em;margin:9px 0 0}.section-head>p:not(.eyebrow){font-size:13.5px;color:var(--market-muted);margin-top:10px;line-height:1.8}.home-section .work-panel{margin:0;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.stats{margin-top:26px}.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);padding:0;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px -18px rgba(23,43,77,.25)}
.stat{padding:24px}.stat+.stat{border-left:1px solid var(--market-border)}.stat b{display:block;font-size:30px;font-weight:700;letter-spacing:-.03em;color:var(--nc-accent);line-height:1.1}.stat span{display:block;font-size:12px;color:var(--market-muted);margin-top:8px;line-height:1.6}
/* --- bento --- */
.bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.tile{position:relative;border-radius:16px;padding:22px;display:flex;flex-direction:column}
.tile:hover{transform:translateY(-3px);border-color:#c9d8ee;box-shadow:0 14px 30px rgba(23,43,77,.10)}
.tile-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--market-accent-soft);color:var(--nc-accent);font-size:19px;margin-bottom:14px}
.tile h3{font-size:14.5px;font-weight:650}.tile p{font-size:12px;line-height:1.8;color:var(--market-muted);margin-top:8px}
.tile-link{font-size:12px;color:var(--nc-accent);margin-top:10px}
.t-launch{grid-column:span 2;grid-row:span 2;justify-content:flex-end;background:linear-gradient(165deg,var(--market-accent-soft),#fff 62%)}
.t-launch .tile-icon{width:44px;height:44px;font-size:21px}.t-launch h3{font-size:19px}.t-launch p{font-size:13px;max-width:420px}
.launch-steps{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:auto;padding:2px 0 26px}
.launch-steps>span{background:#fff;border:1px solid var(--market-border);border-radius:999px;padding:7px 14px;font-size:12px;font-weight:550;box-shadow:0 1px 2px rgba(23,43,77,.05);animation:step-glow 3.2s ease-in-out infinite}
.launch-steps>span:nth-of-type(2){animation-delay:.4s}.launch-steps>span:nth-of-type(3){animation-delay:.8s}.launch-steps>span:nth-of-type(4){animation-delay:1.2s}
@keyframes step-glow{0%,72%,100%{border-color:var(--market-border)}20%{border-color:var(--nc-accent);color:var(--nc-accent);box-shadow:0 2px 10px rgba(22,115,230,.18)}}
.launch-steps i{color:var(--nc-accent);font-style:normal;font-size:13px}
.t-drop{grid-column:span 2;background:linear-gradient(180deg,#f7faff,#fff);border-style:dashed;border-color:#c4d4ec}
.t-drop:hover{border-color:var(--nc-accent)}
.chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.chip-row span{background:var(--market-accent-soft);color:var(--nc-accent);border-radius:999px;padding:4px 11px;font-size:11px;font-weight:550}
/* --- platform card --- */
.platform-card{display:grid;grid-template-columns:1fr auto;gap:18px 30px;align-items:center;padding:26px 30px;border-radius:16px}
.platform-title{font-size:16px;font-weight:650}
.platform-card small{display:block;font-size:12px;color:var(--market-muted);margin-top:6px;line-height:1.7}
.platform-names{display:flex;gap:26px;font-size:17px;font-weight:700;letter-spacing:-.02em}
.platform-sign{grid-column:1/-1;display:flex;align-items:center;gap:8px;border-top:1px solid var(--market-border);padding-top:16px;font-size:12px;color:var(--market-muted)}
/* --- trust --- */
.trust-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.trust-grid .work-panel{padding:24px;border-radius:16px}.trust-grid .work-panel:hover{transform:translateY(-2px);border-color:#c9d8ee;box-shadow:0 10px 26px rgba(23,43,77,.08)}
.trust-grid h3{font-size:15px;font-weight:650}.trust-grid p{margin-top:9px;font-size:12.5px;line-height:1.8;color:var(--market-muted)}
/* --- alpha status --- */
.alpha-row{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;align-items:start}
.alpha-row .work-panel{border-radius:16px;padding:26px}
.alpha-progress h2{font-size:19px;font-weight:650;margin:14px 0 0}.alpha-progress>p{font-size:12.5px;line-height:1.8;color:var(--market-muted);margin:10px 0 18px}
.progress-list{list-style:none;margin:0 0 20px;padding:0;border-top:1px solid #e8edf3}
.progress-list li{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 2px;border-bottom:1px solid #e8edf3;font-size:13px}
.progress-list b{font-size:11px;font-weight:550;border-radius:999px;padding:4px 11px;white-space:nowrap}
.progress-list b.done{background:var(--market-accent-soft);color:var(--nc-accent)}
.progress-list b.wip{background:rgba(230,160,20,.14);color:#a06a00}
.progress-list b.later{background:var(--market-surface-soft);color:var(--market-muted)}
.legacy-note{display:flex;flex-direction:column}
.legacy-tag{font-size:11px;color:var(--market-muted);letter-spacing:.06em;margin-bottom:14px}
.legacy-note h3{font-size:17px;font-weight:650}.legacy-note p{font-size:12.5px;line-height:1.8;color:var(--market-muted);margin:10px 0 16px}
/* --- faq & cta --- */
.faq-list{border-radius:16px;padding:8px 24px}
.faq-item{border-bottom:1px solid #e8edf3}.faq-item:last-child{border-bottom:0}
.faq-item summary{cursor:pointer;padding:16px 2px;font-size:13.5px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;transition:color .15s ease}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary:after{content:'+';font-size:16px;font-weight:400;color:var(--market-muted);transition:transform .2s ease}
.faq-item[open] summary:after{transform:rotate(45deg)}
.faq-item summary:hover{color:var(--nc-accent)}
.faq-item p{font-size:12.5px;line-height:1.85;color:var(--market-muted);padding:0 2px 18px;max-width:760px}
.final-cta{margin-bottom:16px}
.cta-panel{position:relative;overflow:hidden;text-align:center;border-radius:20px;padding:56px 32px;color:var(--market-text);background:var(--market-surface);border:1px solid var(--market-border);box-shadow:0 16px 40px -24px rgba(23,43,77,.20)}
.cta-panel:before{content:'';position:absolute;inset:0;background:radial-gradient(560px 280px at 78% 0%,rgba(91,161,245,.12),transparent 60%);pointer-events:none}
.cta-panel .eyebrow{color:var(--market-muted)}
.cta-panel h2{position:relative;font-size:28px;font-weight:700;letter-spacing:-.02em;margin:10px 0 0}
.cta-panel>p:not(.eyebrow):not(.cta-fine){position:relative;font-size:13px;color:var(--market-muted);margin-top:12px}
.cta-actions{position:relative;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.cta-panel .hero-cta{min-height:44px;padding:12px 28px;font-size:14px}
.cta-panel .primary-button:hover{box-shadow:0 10px 26px rgba(22,115,230,.30)}
.cta-fine{position:relative;font-size:11.5px;color:var(--market-muted);margin-top:24px}.cta-fine a{color:var(--nc-accent);text-decoration:underline}
/* --- tablet / phone --- */
@media(max-width:800px){
.hero-card{padding:42px 22px 30px;border-radius:18px}.hero-card h1{font-size:28px}.hero-sub{font-size:13px}
.product-stage{padding-top:30px}.window-body{height:235px;grid-template-columns:24px .8fr 1.2fr;gap:9px;padding:12px 12px 12px 0}
.window-caption{height:38px;font-size:13px;padding:0 12px}.window-caption img{width:18px;height:18px}
.window-account,.window-version{padding:10px}.window-account strong{font-size:16px}.window-account small{font-size:11px}
.player-mark{margin:18px 0 9px;width:36px;height:36px;border-top-width:9px;border-bottom-width:8px}.player-mark span,.player-mark i{top:5px;width:7px;height:5px}
.mock-chip{font-size:10px;margin-top:14px;padding:4px 8px}.window-rail{font-size:16px;gap:15px}.mock-label{font-size:11px}
.window-right{gap:9px}.window-about{padding:10px;gap:9px}.window-about strong{font-size:12px}.window-about p{font-size:10px}.about-mark{font-size:22px}
.version-detail{gap:7px;margin:10px 0}.version-detail strong{font-size:15px}.version-detail small{font-size:10px}.mock-launch{font-size:11px;padding:6px}.grass-block{font-size:22px}
.stats-strip{grid-template-columns:repeat(2,1fr)}.stat{padding:18px 20px}.stat+.stat{border-left:0}.stat:nth-child(even){border-left:1px solid var(--market-border)}.stat:nth-child(n+3){border-top:1px solid var(--market-border)}.stat b{font-size:26px}
.bento{grid-template-columns:repeat(2,minmax(0,1fr))}.t-launch{grid-column:span 2;grid-row:auto}.t-drop{grid-column:span 2}
.trust-grid,.alpha-row{grid-template-columns:1fr}
.platform-card{grid-template-columns:1fr}.platform-names{gap:20px;font-size:15px}
.home-section{margin-top:42px}.cta-panel{padding:42px 22px}.cta-panel h2{font-size:23px}}
@media(max-width:480px){
.hero-card h1{font-size:24px}.hero-actions{flex-direction:column;width:100%}.hero-btn{width:100%;justify-content:center}
.hero-version{font-size:11px}.bento{grid-template-columns:1fr}.t-launch,.t-drop{grid-column:auto}
.tile{padding:18px}.section-head h2{font-size:20px}.faq-list{padding:4px 16px}.faq-item summary{font-size:13px;padding:14px 2px}
.cta-actions{flex-direction:column}.cta-panel .hero-cta{width:100%}.stat span{font-size:11px}.window-body{height:200px}}
</style>
