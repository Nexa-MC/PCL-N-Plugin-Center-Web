<template>
  <div ref="root" class="home-page">
    <section class="home-hero">
      <p class="eyebrow hero-anim d1">NEXACL · MINECRAFT LAUNCHER 2.0</p>
      <h1 class="hero-anim d2">{{ en ? 'A Minecraft launcher that asks less from you.' : '一个更省心的 Minecraft 启动器。' }}</h1>
      <p class="hero-description hero-anim d3">{{ en ? 'Instances, Java, accounts and updates are handled for you whenever possible. You only make the choices that actually matter.' : '实例、Java、账号和更新，能自动处理的就交给启动器。你只需要处理真正需要选择的部分。' }}</p>
      <div class="hero-actions hero-anim d4">
        <router-link class="primary-button hero-cta" to="/download">{{ en ? 'Try the Alpha' : '体验 Alpha 版' }} <span aria-hidden="true">↓</span></router-link>
        <router-link class="text-link" to="/changelog">{{ en ? 'See what’s new' : '查看更新日志' }} <span aria-hidden="true">›</span></router-link>
      </div>
      <p class="hero-status hero-anim d5"><span class="status-pill">Alpha</span>{{ en ? 'Called Nexa during Alpha. It becomes NexaCL after Alpha ends.' : 'Alpha 期间名为 Nexa，Alpha 结束后正式改名 NexaCL。' }}<template v-if="latestVersion">　·　{{ en ? 'Current build' : '当前测试版本' }} {{ latestVersion }}</template></p>
      <div class="product-stage hero-anim d6">
        <div class="product-window" role="img" :aria-label="en ? 'Illustration of the Nexa launcher layout' : 'Nexa 启动器布局示意'">
          <div class="window-caption"><span><img src="/pcln.png" alt="">NexaCL</span><span class="window-controls" aria-hidden="true">−　□　×</span></div>
          <div class="window-body"><div class="window-rail" aria-hidden="true"><span class="active">▷</span><span>▧</span><span>▦</span><span>⚙</span></div>
            <div class="window-account"><div class="mock-label">{{ en ? 'Profile' : '档案' }}<span>＋</span></div><div class="player-mark" aria-hidden="true"><span></span><i></i></div><strong>Player</strong><small>{{ en ? 'Offline profile' : '离线档案' }}</small><div class="mock-chip">{{ en ? 'Switch profile' : '切换档案' }}　⌄</div></div>
            <div class="window-right"><div class="window-version"><div class="mock-label">{{ en ? 'Version' : '版本' }}<span>☷</span></div><div class="version-detail"><div class="grass-block" aria-hidden="true">▧</div><div><strong>1.21.1</strong><small>Minecraft Java Edition</small></div><span>›</span></div><div class="mock-launch">▷　{{ en ? 'Launch game' : '启动游戏' }}</div></div><div class="window-about"><span class="about-mark">N</span><div><strong>NexaCL</strong><p>{{ en ? 'Your next game starts here.' : '下一次游戏，从这里开始。' }}</p></div></div></div>
          </div>
        </div>
        <p class="product-caption">{{ en ? 'Interface illustration. The Alpha interface may change.' : '界面示意。Alpha 版本的界面仍会调整。' }}</p>
      </div>
    </section>

    <section class="home-section reveal" :aria-label="en ? 'By the numbers' : '数字一览'">
      <div class="stats-strip work-panel">
        <div class="stat"><b data-count="3">0</b><span>{{ en ? 'major platforms — Windows, macOS, Linux' : '个大平台 · Windows / macOS / Linux' }}</span></div>
        <div class="stat"><b data-count="6">0</b><span>{{ en ? 'native build targets, x64 and ARM64' : '组原生构建 · x64 与 ARM64' }}</span></div>
        <div class="stat"><b data-count="4">0</b><span>{{ en ? 'Java generations matched automatically (8–25)' : '个 Java 世代自动匹配（8–25）' }}</span></div>
        <div class="stat"><b data-count="1">0</b><span>{{ en ? 'click upgrade from 1.4.x to 2.0' : '键升级 · 从 1.4.x 到 2.0' }}</span></div>
      </div>
    </section>

    <section class="home-section naming reveal" aria-label="Naming roadmap">
      <div class="section-head"><p class="eyebrow">{{ en ? 'One more name change' : '名字还会再变一次' }}</p><h2>{{ en ? 'The name changes. The upgrade path stays simple.' : '名字在变，升级路线不会乱。' }}</h2></div>
      <ol class="naming-steps stagger">
        <li class="work-panel"><span class="step-no">01</span><h3>Nexa 1.4.x</h3><p>{{ en ? 'The current stable release, and the safer daily driver during Alpha.' : '现在的稳定版。Alpha 期间更适合日常使用。' }}</p></li>
        <li class="work-panel current"><span class="step-no">02</span><span class="status-pill">Alpha</span><h3>Nexa 2.0</h3><p>{{ en ? 'The next generation, in testing now. Upgrade directly from 1.4.x.' : '正在测试的下一代版本，可从 1.4.x 直接升级。' }}</p></li>
        <li class="work-panel"><span class="step-no">03</span><h3>NexaCL</h3><p>{{ en ? 'The official product name once Alpha ends.' : 'Alpha 结束后的正式名称。' }}</p></li>
      </ol>
    </section>

    <section class="home-section reveal">
      <div class="section-head"><p class="eyebrow">{{ en ? 'Everyday use' : '日常使用' }}</p><h2>{{ en ? 'Starting the game should take less work.' : '日常启动游戏，应该少操点心。' }}</h2><p>{{ en ? 'Instances, Java, accounts, resources and updates — whatever can be automated is automated.' : '实例、Java、账号、资源和更新，能自动处理的就交给启动器。' }}</p></div>
      <div class="feature-grid stagger">
        <article class="work-panel feature-large"><div class="launch-steps" aria-hidden="true"><span>{{ en ? 'Find instances' : '查找实例' }}</span><i>→</i><span>{{ en ? 'Pick Java' : '选择 Java' }}</span><i>→</i><span>{{ en ? 'Prepare assets' : '准备资源' }}</span><i>→</i><span>{{ en ? 'Watch process' : '记录进程' }}</span></div><h3>{{ en ? 'Launch Minecraft' : '启动 Minecraft' }}</h3><p>{{ en ? 'The launcher finds local instances, handles version inheritance, picks the right Java, and prepares assets and dependencies. After the game starts it keeps watching the process, so crashes are easier to trace.' : '启动器会找到本地实例，处理版本继承，选择合适的 Java，再准备资源和依赖。游戏启动后，它也会继续记录进程状态，方便排查崩溃。' }}</p></article>
        <article class="work-panel"><div class="feature-symbol">⇩</div><h3>{{ en ? 'Downloads keep going' : '下载中断了也能继续' }}</h3><p>{{ en ? 'Interrupted downloads resume. Large files download in segments, and the launcher switches sources when one fails.' : '下载中断后可以继续。大文件会分段下载，某个来源不可用时自动换源。' }}</p><div class="chip-row"><span>{{ en ? 'Resume' : '断点续传' }}</span><span>{{ en ? 'Segments' : '分段下载' }}</span><span>{{ en ? 'Failover' : '自动换源' }}</span></div></article>
        <article class="work-panel"><div class="feature-symbol">↻</div><h3>{{ en ? 'Updates with less fuss' : '更新少折腾' }}</h3><p>{{ en ? 'It checks what is available, then picks a full package or a smaller patch. Files are verified before installing, and 1.4.x upgrades straight to 2.0.' : '先检查可用版本，再决定用完整包还是更小的补丁。下载完成后先验证再安装，1.4.x 可直接升级到 2.0。' }}</p><div class="chip-row"><span>{{ en ? 'Patches' : '增量补丁' }}</span><span>{{ en ? 'Verify first' : '先验证' }}</span><span>{{ en ? '1.4.x → 2.0' : '一键升级' }}</span></div></article>
        <article class="work-panel"><div class="feature-symbol">☺</div><h3>{{ en ? 'Accounts and appearance' : '账号和外观' }}</h3><p>{{ en ? 'Sign in with Microsoft, Yggdrasil or LittleSkin. Skins, capes and the LittleSkin closet keep filling in — credentials never enter public state.' : '支持 Microsoft、Yggdrasil 和 LittleSkin 登录。皮肤、披风和 LittleSkin 衣柜持续补齐，登录凭据不会直接放进公开状态。' }}</p></article>
        <article class="work-panel"><div class="feature-symbol">✦</div><h3>{{ en ? 'A new interface, filling in' : '新的界面正在补齐' }}</h3><p>{{ en ? '2.0 already ships a new window, navigation and launch page, with motion, reduced-motion and accessibility wired in. The remaining pages keep migrating.' : '2.0 已经换上新的窗口、导航和启动页，动效、减少动态效果和无障碍也已接入，其余页面还在继续迁移。' }}</p></article>
      </div>
    </section>

    <section class="home-section reveal">
      <div class="section-head"><p class="eyebrow">{{ en ? 'Modpacks and imports' : '整合包与导入' }}</p><h2>{{ en ? 'Drop it in. Done.' : '拖进来，就能装。' }}</h2><p>{{ en ? 'Drag files onto the window and the launcher takes over — with transactions, so a failed import changes nothing.' : '把文件拖到窗口上，剩下的交给启动器。导入以事务执行，失败不会留下半成品。' }}</p></div>
      <div class="dropzone" aria-hidden="true">
        <span class="drop-icon">⤓</span>
        <strong>{{ en ? 'Drop to install' : '拖入窗口即可安装' }}</strong>
        <div class="chip-row"><span>MRPACK</span><span>CurseForge ZIP</span><span>{{ en ? 'Mod JARs' : '模组 JAR' }}</span><span>Forge / NeoForge / OptiFine</span><span>{{ en ? 'Game folders' : '游戏文件夹' }}</span></div>
      </div>
      <p class="drop-note">{{ en ? 'Folder imports rebuild the version inheritance chain and never copy the parent’s saves or configs. Installers must pass real-file checks before anything is applied.' : '文件夹导入会自动补齐版本继承链，不复制父版本的存档与配置；安装器需通过真实文件校验后才会应用。' }}</p>
    </section>

    <section class="home-section reveal">
      <div class="section-head"><p class="eyebrow">{{ en ? 'Play without fear' : '放心折腾' }}</p><h2>{{ en ? 'Mistakes are recoverable.' : '出了问题，也能退回来。' }}</h2></div>
      <div class="trust-grid stagger">
        <article class="work-panel"><div class="feature-symbol">↩</div><h3>{{ en ? 'Snapshots and rollback' : '快照与回滚' }}</h3><p>{{ en ? 'After a successful launch the launcher records a baseline. If something breaks, review the diff and roll back item by item, or in one click.' : '成功启动后自动记录基线快照。出问题时可以查看差异清单，逐条或一键回滚到上次的正常状态。' }}</p><div class="chip-row"><span>{{ en ? 'Baseline' : '成功基线' }}</span><span>{{ en ? 'Diff view' : '差异清单' }}</span><span>{{ en ? 'One-click rollback' : '一键回滚' }}</span></div></article>
        <article class="work-panel"><div class="feature-symbol">▦</div><h3>{{ en ? 'Mods and resources, organized' : '模组与资源，管得清楚' }}</h3><p>{{ en ? 'Filter mods by category, toggle them in place, check verified compatible updates, and search the resource catalog without leaving the launcher.' : '按分类筛选模组、就地启停，更新前校验兼容性，资源目录直接搜索，不用离开启动器。' }}</p><div class="chip-row"><span>{{ en ? 'Category filter' : '分类筛选' }}</span><span>{{ en ? 'Enable in place' : '就地启停' }}</span><span>{{ en ? 'Compat check' : '兼容校验' }}</span></div></article>
      </div>
    </section>

    <section class="home-section platform-strip work-panel reveal" aria-label="Platforms">
      <p>{{ en ? 'Three platforms. One familiar place.' : '三个平台，一个熟悉的入口。' }}<small>{{ en ? 'Installers and portable archives for x64 and ARM64.' : '每个平台提供 x64 与 ARM64 的安装包和便携包。' }}</small></p>
      <div class="platform-names"><span>Windows</span><span>macOS</span><span>Linux</span></div>
    </section>

    <section class="home-section reveal">
      <div class="section-head"><p class="eyebrow">{{ en ? 'Why rewrite for 2.0' : '为什么要做 2.0' }}</p><h2>{{ en ? 'Rebuilt to break less.' : '重做这些，是为了少出问题。' }}</h2><p>{{ en ? '2.0 runs on an all-new foundation. You never need to remember these names — they exist to fix speed, stability and long-term maintenance.' : '2.0 的底层换了全新的架构。你不需要记住这些名字，它们解决的是速度、稳定性和后续维护的问题。' }}</p></div>
      <div class="tech-grid stagger">
        <article class="work-panel"><h3>{{ en ? 'Fewer detours' : '少绕一层' }}</h3><p>{{ en ? 'Launch and UI updates take a more direct path, with less unnecessary relaying.' : '启动和界面更新尽量走更直接的路径，少做不必要的中转。' }}</p></article>
        <article class="work-panel"><h3>{{ en ? 'Easier to diagnose' : '出问题更好查' }}</h3><p>{{ en ? 'Downloads, updates and plugins have clear boundaries, so failures are easier to locate.' : '下载、更新和插件都有更清楚的边界，某一块出错时更容易找到原因。' }}</p></article>
        <article class="work-panel"><h3>{{ en ? 'Room to grow' : '以后更好加功能' }}</h3><p>{{ en ? 'New pages and plugin capabilities stack on top, instead of bending around legacy code.' : '新页面和插件能力可以继续往上加，不用一直绕着旧代码改。' }}</p></article>
      </div>
      <p class="tech-strip" :aria-label="en ? 'Underlying technologies' : '底层技术'"><span>XSR</span><span>NativeAOT</span><span>UI.Next</span><span>PXML</span><span>Sidecar</span></p>
      <div class="privacy-strip work-panel">
        <span>🔒 {{ en ? 'Credentials protected by the system keyring' : '登录凭据由系统钥匙串保护' }}</span>
        <span>{{ en ? 'Transparent telemetry — log bodies are never collected' : '遥测透明 · 不采集日志正文' }}</span>
        <span>{{ en ? 'Your game data stays local' : '游戏数据始终留在本地' }}</span>
      </div>
    </section>

    <section class="home-section alpha-row reveal">
      <article class="work-panel alpha-progress"><span class="status-pill">Alpha</span><h2>{{ en ? 'Usable, not finished.' : '能用了，但还没做完。' }}</h2><p>{{ en ? 'The foundation, interface, settings, downloads, updates, accounts and the Minecraft launch flow all have 2.0 versions. Product pages and plugin capabilities are what we are filling in now.' : '启动器底层、界面、设置、下载、更新、账号和 Minecraft 启动流程都已经有 2.0 版本，现在主要在补产品页面和插件能力。' }}</p>
        <ul class="progress-list">
          <li><span>{{ en ? 'Launcher foundation' : '启动器基础功能' }}</span><b class="done">{{ en ? 'Mostly complete' : '主要部分已完成' }}</b></li>
          <li><span>{{ en ? 'Minecraft launch flow' : 'Minecraft 启动流程' }}</span><b class="wip">{{ en ? 'Being polished' : '正在打磨' }}</b></li>
          <li><span>{{ en ? 'Interface and pages' : '界面和页面' }}</span><b class="wip">{{ en ? 'In progress' : '正在做' }}</b></li>
          <li><span>{{ en ? 'Plugins and ecosystem' : '插件和生态' }}</span><b class="later">{{ en ? 'Up next' : '后面再做' }}</b></li>
        </ul>
        <a class="text-link" :href="NEXA_GITHUB + '/issues'" target="_blank" rel="noreferrer">{{ en ? 'Share feedback on GitHub' : '前往 GitHub 反馈问题' }} ↗</a>
      </article>
      <article class="work-panel legacy-note"><span class="legacy-tag">Nexa 1.4.x</span><h3>{{ en ? 'Just want to play?' : '只想稳定玩游戏？' }}</h3><p>{{ en ? '1.4.x remains the stable release during Alpha. Keep using it — 2.0 takes over only after it passes the cutover checks.' : 'Alpha 期间，1.4.x 仍然是稳定版，不必急着更换。等 2.0 完成切换检查后，才会正式接替它。' }}</p><router-link class="text-link" to="/download?product=legacy">{{ en ? 'Download Nexa 1.4.x' : '下载 Nexa 1.4.x' }} ›</router-link></article>
    </section>

    <section class="home-section reveal">
      <div class="section-head"><p class="eyebrow">{{ en ? 'FAQ' : '常见问题' }}</p><h2>{{ en ? 'Straight answers.' : '先把问题说清楚。' }}</h2></div>
      <div class="faq-list work-panel">
        <details class="faq-item"><summary>{{ en ? 'Is Nexa already NexaCL?' : 'Nexa 现在就是 NexaCL 吗？' }}</summary><p>{{ en ? 'Not yet. Nexa is the name used during the 2.0 Alpha. The product is officially renamed NexaCL after Alpha ends.' : '不是。Nexa 只是 2.0 Alpha 期间使用的名字，Alpha 结束后才会正式改名为 NexaCL。' }}</p></details>
        <details class="faq-item"><summary>{{ en ? 'Will 2.0 replace 1.4.x?' : '2.0 现在会取代 1.4.x 吗？' }}</summary><p>{{ en ? 'Not yet. 1.4.x stays the stable release during Alpha. 2.0 takes over only after it is finished and passes the cutover checks.' : '还不会。Alpha 期间 1.4.x 仍然是稳定版；等 2.0 做完并通过切换检查后，才会正式接替它。' }}</p></details>
        <details class="faq-item"><summary>{{ en ? 'Can 1.4.x upgrade to 2.0?' : '1.4.x 能升级到 2.0 吗？' }}</summary><p>{{ en ? 'Yes. The update system upgrades 1.4.x straight to 2.0. After moving to 2.0, downgrades are never offered.' : '可以。更新系统支持从 1.4.x 直接升级到 2.0；进入 2.0 后，启动器不会提供降级选项。' }}</p></details>
        <details class="faq-item"><summary>{{ en ? 'Why rewrite so much?' : '为什么这次要重写这么多？' }}</summary><p>{{ en ? 'The old architecture became harder to change. 2.0 re-lays the foundation of launching, UI, updates and plugins once, so future features land easier.' : '旧架构已经越来越难继续改。2.0 选择一次把启动、界面、更新和插件的基础重新整理好，后面做功能会轻松很多。' }}</p></details>
        <details class="faq-item"><summary>{{ en ? 'Should I use the Alpha now?' : '我现在适合用 Alpha 吗？' }}</summary><p>{{ en ? 'If you want an early look at 2.0 and accept that pages and behavior still change, try it. If you just want stable gaming, stay on 1.4.x.' : '想提前体验 2.0、能接受页面和功能还会变化，可以试 Alpha；只想稳定玩游戏，继续用 1.4.x 更合适。' }}</p></details>
      </div>
    </section>

    <section class="home-section final-cta reveal">
      <div class="cta-panel">
        <p class="eyebrow">NEXACL · 2.0 ALPHA</p>
        <h2>{{ en ? 'Ready to try it?' : '准备好试试了吗？' }}</h2>
        <p>{{ en ? 'The Alpha moves fast, and every piece of feedback shapes the next build.' : 'Alpha 正在快速迭代，你的每一条反馈都会影响下一个版本。' }}</p>
        <div class="hero-actions">
          <router-link class="primary-button hero-cta" to="/download">{{ en ? 'Download Nexa 2.0 Alpha' : '下载 Nexa 2.0 Alpha' }} <span aria-hidden="true">↓</span></router-link>
          <router-link class="secondary-button hero-cta" to="/download?product=legacy">{{ en ? 'Stay on 1.4.x' : '继续用 1.4.x' }}</router-link>
        </div>
        <p class="cta-fine">{{ en ? 'Built by the community' : '由社区开发' }} · Apache-2.0 · <a :href="NEXA_GITHUB" target="_blank" rel="noreferrer">GitHub ↗</a></p>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { NEXA_GITHUB, loadNexaCatalog } from '@/utils/nexaReleases';
import { applyPageSeo } from '@/utils/seo';
const { locale } = useI18n();
const en = computed(() => locale.value !== 'zh');
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
watchEffect(() => { applyPageSeo({ title: en.value ? 'NexaCL — A Minecraft launcher that asks less from you' : 'NexaCL — 一个更省心的 Minecraft 启动器', description: en.value ? 'NexaCL is the next-generation PCL N launcher for Windows, macOS and Linux. Instances, Java, accounts and updates are handled for you. Try the 2.0 Alpha or stay on 1.4.x.' : 'NexaCL 是 PCL N 的下一代 Minecraft 启动器，支持 Windows、macOS 和 Linux。实例、Java、账号和更新能自动处理的都交给启动器。体验 2.0 Alpha，或继续使用 1.4.x 稳定版。', path: '/' }); document.documentElement.lang = en.value ? 'en' : 'zh-CN'; });
</script>
<style scoped>
.home-page{max-width:1080px;margin:0 auto}
/* --- reveal & entrance motion (globally disabled under prefers-reduced-motion) --- */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .55s ease,transform .55s ease}.reveal.in{opacity:1;transform:none}
.stagger>*{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease}.in .stagger>*,.stagger.in>*{opacity:1;transform:none}
.stagger>*:nth-child(2){transition-delay:.07s}.stagger>*:nth-child(3){transition-delay:.14s}.stagger>*:nth-child(4){transition-delay:.21s}.stagger>*:nth-child(5){transition-delay:.28s}
@keyframes hero-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hero-anim{animation:hero-rise .6s cubic-bezier(.22,.8,.32,1) both}.hero-anim.d1{animation-delay:.02s}.hero-anim.d2{animation-delay:.08s}.hero-anim.d3{animation-delay:.15s}.hero-anim.d4{animation-delay:.22s}.hero-anim.d5{animation-delay:.29s}.hero-anim.d6{animation-delay:.36s;animation-duration:.8s}
/* --- hero --- */
.home-hero{text-align:center;padding:26px 0 0}.home-hero h1{font-size:34px;font-weight:650;letter-spacing:-.02em;line-height:1.3;margin:14px 0 0}.hero-description{font-size:14.5px;line-height:1.8;color:var(--market-muted);max-width:560px;margin:14px auto 0}.hero-actions{display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:24px}.hero-cta{min-height:42px;padding:11px 26px;font-size:14px;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}.hero-cta:hover{transform:translateY(-1px)}.hero-actions .primary-button:hover{box-shadow:0 8px 20px rgba(22,115,230,.28)}.hero-cta:active{transform:scale(.97)}.hero-status{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin:20px 0 0;font-size:12px;color:var(--market-muted)}
.product-stage{position:relative;padding:44px 0 8px;margin:auto;max-width:860px}.product-stage:before{content:'';position:absolute;inset:12% -10% 0;z-index:0;background:radial-gradient(ellipse,rgba(91,161,245,.18),transparent 67%);pointer-events:none;animation:glow-breathe 7s ease-in-out infinite}@keyframes glow-breathe{0%,100%{opacity:.75}50%{opacity:1}}
.product-window{position:relative;border-radius:16px;background:#f8faff;border:1px solid #dce7f6;box-shadow:0 30px 55px -28px #304e7659,0 4px 14px #304e7610;overflow:hidden;text-align:left;color:#1e3350}.window-caption{height:46px;background:var(--nc-accent);color:white;display:flex;justify-content:space-between;align-items:center;padding:0 18px;font-size:15px;font-weight:600}.window-caption>span{display:flex;align-items:center;gap:9px}.window-caption img{width:21px;height:21px}.window-controls{font-weight:400;opacity:.85}.window-body{display:grid;grid-template-columns:46px .8fr 1.2fr;gap:16px;padding:20px 20px 20px 0;height:340px}.window-rail{display:flex;align-items:center;flex-direction:column;gap:22px;color:#5e718a;font-size:20px}.window-rail .active{color:var(--nc-accent)}.window-account,.window-version,.window-about{border:1px solid #e5eaf3;border-radius:14px;background:white}.window-account{display:flex;align-items:center;flex-direction:column;padding:16px}.mock-label{display:flex;justify-content:space-between;width:100%;font-size:12.5px;color:#617188}.mock-label span{color:var(--nc-accent)}.player-mark{width:48px;height:48px;background:#bd9676;margin:28px 0 12px;position:relative;border-top:15px solid #493a32;border-bottom:11px solid #77583f}.player-mark span,.player-mark i{position:absolute;top:7px;width:10px;height:6px;background:#4c7c92}.player-mark span{left:6px}.player-mark i{right:6px}.window-account strong{font-size:19px}.window-account small{color:#67798d;font-size:12px}.mock-chip{margin-top:18px;border-radius:40px;background:var(--market-accent-soft);color:var(--nc-accent);font-size:12px;padding:5px 13px}.window-right{display:grid;grid-template-rows:1.65fr 1fr;gap:14px}.window-version{padding:16px}.version-detail{display:flex;gap:12px;align-items:center;margin:13px 0}.version-detail strong{font-size:17px}.version-detail small{display:block;color:#6d7d90;font-size:11px}.version-detail>span:last-child{margin-left:auto;color:#8094ac}.grass-block{color:#56814c;font-size:29px}.mock-launch{background:var(--nc-accent);border-radius:10px;text-align:center;padding:8px;color:white;font-size:14px;animation:launch-pulse 3.2s ease-in-out infinite}@keyframes launch-pulse{0%,100%{box-shadow:0 0 0 0 rgba(22,115,230,.35)}55%{box-shadow:0 0 0 7px rgba(22,115,230,0)}}.window-about{display:flex;align-items:center;gap:15px;padding:18px}.about-mark{font-size:30px;color:var(--nc-accent);font-weight:650}.window-about p{font-size:12px;color:#748196;margin-top:3px}.product-caption{position:relative;color:var(--market-muted);font-size:11px;margin-top:14px}
/* --- sections & cards --- */
.home-section{margin-top:52px}.section-head{max-width:640px;margin-bottom:22px}.section-head h2{font-size:21px;font-weight:650;letter-spacing:-.01em;margin:8px 0 0}.section-head>p:not(.eyebrow){font-size:13px;color:var(--market-muted);margin-top:8px;line-height:1.8}.home-section .work-panel{margin:0;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);padding:0;border-radius:14px;overflow:hidden}.stat{padding:22px 24px;text-align:left}.stat+.stat{border-left:1px solid var(--market-border)}.stat b{display:block;font-size:30px;font-weight:700;letter-spacing:-.03em;color:var(--nc-accent);line-height:1.1}.stat span{display:block;font-size:12px;color:var(--market-muted);margin-top:7px;line-height:1.6}
.naming-steps{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0;padding:0}.naming-steps li{position:relative;padding:22px;border-radius:14px}.naming-steps li:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(23,43,77,.08)}.naming-steps li.current{border-color:var(--nc-accent);box-shadow:0 8px 24px rgba(22,115,230,.10)}.naming-steps .status-pill{position:absolute;top:18px;right:18px}.step-no{display:block;font-size:11px;font-weight:650;color:var(--market-muted);letter-spacing:.08em;margin-bottom:12px}.naming-steps h3{font-size:17px;font-weight:650;margin-bottom:7px}.naming-steps p{font-size:12.5px;line-height:1.75;color:var(--market-muted)}
.feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.feature-grid .work-panel{padding:24px;border-radius:14px}.feature-grid .work-panel:hover{transform:translateY(-2px);border-color:#c9d8ee;box-shadow:0 10px 26px rgba(23,43,77,.08)}.feature-grid h3{font-size:16px;font-weight:650}.feature-grid p{margin:9px 0 0;font-size:12.5px;line-height:1.8;color:var(--market-muted)}.feature-large{grid-row:span 2;display:flex;flex-direction:column;justify-content:end;background:linear-gradient(180deg,var(--market-accent-soft),#fff 58%)}.launch-steps{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:auto;padding:4px 0 24px}.launch-steps span{background:#fff;border:1px solid var(--market-border);color:var(--market-text);border-radius:999px;padding:6px 13px;font-size:12px;font-weight:550;box-shadow:0 1px 2px rgba(23,43,77,.05);animation:step-glow 3.2s ease-in-out infinite}.launch-steps span:nth-of-type(2){animation-delay:.4s}.launch-steps span:nth-of-type(3){animation-delay:.8s}.launch-steps span:nth-of-type(4){animation-delay:1.2s}@keyframes step-glow{0%,72%,100%{border-color:var(--market-border);color:var(--market-text)}20%{border-color:var(--nc-accent);color:var(--nc-accent);box-shadow:0 2px 10px rgba(22,115,230,.18)}}.launch-steps i{color:var(--nc-accent);font-style:normal;font-size:13px}.feature-symbol{font-size:24px;color:var(--nc-accent);margin-bottom:14px}.chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.chip-row span{background:var(--market-accent-soft);color:var(--nc-accent);border-radius:999px;padding:4px 11px;font-size:11.5px;font-weight:550}
.dropzone{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;border:2px dashed #c4d4ec;border-radius:16px;padding:38px 24px;background:linear-gradient(180deg,#f7faff,#fff);transition:border-color .2s ease}.dropzone:hover{border-color:var(--nc-accent)}.drop-icon{font-size:30px;color:var(--nc-accent);animation:drop-float 3s ease-in-out infinite}@keyframes drop-float{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}.dropzone strong{font-size:15px;font-weight:650}.dropzone .chip-row{justify-content:center;margin-top:2px}.drop-note{font-size:12px;color:var(--market-muted);margin-top:14px;line-height:1.8;max-width:720px}
.trust-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.trust-grid .work-panel{padding:24px;border-radius:14px}.trust-grid .work-panel:hover{transform:translateY(-2px);border-color:#c9d8ee;box-shadow:0 10px 26px rgba(23,43,77,.08)}.trust-grid h3{font-size:16px;font-weight:650}.trust-grid p{margin:9px 0 0;font-size:12.5px;line-height:1.8;color:var(--market-muted)}
.platform-strip{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;padding:22px 25px;border-radius:14px}.platform-strip>p{font-size:14px;font-weight:600;color:var(--market-text)}.platform-strip small{display:block;font-size:12px;font-weight:400;color:var(--market-muted);margin-top:5px}.platform-names{display:flex;gap:28px;font-size:16px;font-weight:650;letter-spacing:-.02em}
.tech-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.tech-grid .work-panel{padding:22px;border-radius:14px}.tech-grid .work-panel:hover{transform:translateY(-2px);border-color:#c9d8ee;box-shadow:0 10px 26px rgba(23,43,77,.08)}.tech-grid h3{font-size:15px;font-weight:650}.tech-grid p{margin-top:9px;font-size:12.5px;line-height:1.8;color:var(--market-muted)}.tech-strip{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-top:20px}.tech-strip span{border:1px dashed var(--market-border);color:var(--market-muted);border-radius:999px;padding:6px 15px;font-size:12px;transition:color .2s ease,border-color .2s ease}.tech-strip span:hover{color:var(--nc-accent);border-color:var(--nc-accent)}
.privacy-strip{display:flex;justify-content:center;flex-wrap:wrap;gap:10px 0;margin-top:16px;padding:15px 22px;border-radius:12px;background:var(--market-surface-soft);border:1px solid var(--market-border);box-shadow:none}.privacy-strip span{font-size:12px;color:var(--market-muted);padding:0 16px}.privacy-strip span+span{border-left:1px solid var(--market-border)}
.alpha-row{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;align-items:start;margin-bottom:0}.alpha-row .work-panel{border-radius:14px;padding:26px}.alpha-progress h2{font-size:19px;font-weight:650;margin:14px 0 0}.alpha-progress>p{font-size:12.5px;line-height:1.8;color:var(--market-muted);margin:10px 0 18px}.progress-list{list-style:none;margin:0 0 20px;padding:0;border-top:1px solid #e8edf3}.progress-list li{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 2px;border-bottom:1px solid #e8edf3;font-size:13px}.progress-list b{font-size:11px;font-weight:550;border-radius:999px;padding:4px 11px;white-space:nowrap}.progress-list b.done{background:var(--market-accent-soft);color:var(--nc-accent)}.progress-list b.wip{background:rgba(230,160,20,.14);color:#a06a00}.progress-list b.later{background:var(--market-surface-soft);color:var(--market-muted)}.legacy-note{display:flex;flex-direction:column}.legacy-tag{font-size:11px;color:var(--market-muted);letter-spacing:.06em;margin-bottom:14px}.legacy-note h3{font-size:17px;font-weight:650}.legacy-note p{font-size:12.5px;line-height:1.8;color:var(--market-muted);margin:10px 0 16px}
.faq-list{border-radius:14px;padding:8px 24px}.faq-item{border-bottom:1px solid #e8edf3}.faq-item:last-child{border-bottom:0}.faq-item summary{cursor:pointer;padding:16px 2px;font-size:13.5px;font-weight:600;color:var(--market-text);list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;transition:color .15s ease}.faq-item summary::-webkit-details-marker{display:none}.faq-item summary:after{content:'+';font-size:16px;font-weight:400;color:var(--market-muted);transition:transform .2s ease}.faq-item[open] summary:after{transform:rotate(45deg)}.faq-item summary:hover{color:var(--nc-accent)}.faq-item p{font-size:12.5px;line-height:1.85;color:var(--market-muted);padding:0 2px 18px;max-width:760px}
.final-cta{margin-bottom:16px}.cta-panel{text-align:center;border:1px solid #dce7f6;border-radius:18px;padding:52px 32px;background:linear-gradient(180deg,var(--market-accent-soft),#fff 62%)}.cta-panel h2{font-size:26px;font-weight:650;letter-spacing:-.015em;margin:10px 0 0}.cta-panel>p:not(.eyebrow):not(.cta-fine){font-size:13px;color:var(--market-muted);margin-top:10px}.cta-panel .hero-actions{margin-top:26px}.cta-fine{font-size:11.5px;color:var(--market-muted);margin-top:22px}.cta-fine a{color:var(--nc-accent)}
/* --- tablet / phone --- */
@media(max-width:800px){.home-hero h1{font-size:26px}.product-stage{padding-top:32px}.window-body{height:240px;grid-template-columns:24px .8fr 1.2fr;gap:9px;padding:12px 12px 12px 0}.window-caption{height:38px;font-size:13px;padding:0 12px}.window-caption img{width:18px;height:18px}.window-account,.window-version{padding:10px}.window-account strong{font-size:16px}.window-account small{font-size:11px}.player-mark{margin:18px 0 9px;width:36px;height:36px;border-top-width:9px;border-bottom-width:8px}.player-mark span,.player-mark i{top:5px;width:7px;height:5px}.mock-chip{font-size:10px;margin-top:14px;padding:4px 8px}.window-rail{font-size:16px;gap:15px}.mock-label{font-size:11px}.window-right{gap:9px}.window-about{padding:10px;gap:9px}.window-about strong{font-size:12px}.window-about p{font-size:10px}.about-mark{font-size:22px}.version-detail{gap:7px;margin:10px 0}.version-detail strong{font-size:15px}.version-detail small{font-size:10px}.mock-launch{font-size:11px;padding:6px}.grass-block{font-size:22px}
.stats-strip{grid-template-columns:repeat(2,1fr)}.stat{padding:18px 20px}.stat+.stat{border-left:0}.stat:nth-child(even){border-left:1px solid var(--market-border)}.stat:nth-child(n+3){border-top:1px solid var(--market-border)}.stat b{font-size:26px}
.naming-steps,.feature-grid,.trust-grid,.tech-grid,.alpha-row{grid-template-columns:1fr}.feature-large{grid-row:auto}.launch-steps{padding-bottom:18px}.platform-strip{flex-direction:column;align-items:flex-start;gap:14px}.platform-names{gap:20px;font-size:15px}.home-section{margin-top:38px}.privacy-strip{flex-direction:column;gap:0;padding:8px 18px}.privacy-strip span{padding:9px 4px;text-align:center}.privacy-strip span+span{border-left:0;border-top:1px solid var(--market-border)}.cta-panel{padding:40px 22px}.cta-panel h2{font-size:22px}}
@media(max-width:480px){.home-hero{padding-top:12px}.home-hero h1{font-size:23px}.hero-description{font-size:13px}.hero-actions{gap:14px;width:100%}.hero-cta{width:100%;min-height:44px}.hero-status{font-size:11px}.product-stage{padding-top:24px}.window-body{height:205px}.section-head h2{font-size:18px}.naming-steps li,.feature-grid .work-panel,.trust-grid .work-panel,.tech-grid .work-panel{padding:18px}.dropzone{padding:28px 16px}.faq-list{padding:4px 16px}.faq-item summary{font-size:13px;padding:14px 2px}.final-cta .hero-actions{flex-direction:column}.alpha-row .work-panel{padding:20px}.stat span{font-size:11px}}
</style>
