// GitHub 风格的顶部路由进度条:
// 导航开始 → 120ms 内完成则不闪现;否则快速推进到 ~28%,再渐进爬向 82%;
// 导航结束 → 冲到 100% 并淡出。纯 DOM 单例,无依赖。
let bar: HTMLElement | null = null;
let trickle: ReturnType<typeof setInterval> | undefined;
let delayTimer: ReturnType<typeof setTimeout> | undefined;
let active = false, shown = false, pct = 0;

function ensureBar(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (bar && bar.isConnected) return bar;
  bar = document.createElement('div');
  bar.id = 'route-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  return bar;
}

export function startProgress(): void {
  if (active) return;
  active = true; shown = false; pct = 0;
  const el = ensureBar();
  if (!el) return;
  el.style.transition = 'none';
  el.style.width = '0%';
  el.style.opacity = '1';
  delayTimer = setTimeout(() => {
    if (!active) return;
    shown = true;
    el.style.transition = 'width .35s cubic-bezier(.2,.8,.25,1)';
    pct = 28;
    el.style.width = '28%';
    trickle = setInterval(() => {
      if (!active) return;
      pct = Math.min(82, pct + (82 - pct) * 0.2);
      el.style.width = pct.toFixed(2) + '%';
    }, 280);
  }, 120);
}

export function doneProgress(): void {
  if (!active) return;
  active = false;
  clearTimeout(delayTimer);
  clearInterval(trickle);
  const el = ensureBar();
  if (!el) return;
  if (!shown) { el.style.width = '0%'; return; }
  el.style.transition = 'width .18s ease-out, opacity .35s ease .18s';
  el.style.width = '100%';
  el.style.opacity = '0';
  setTimeout(() => {
    if (!active && el) { el.style.transition = 'none'; el.style.width = '0%'; el.style.opacity = '1'; }
  }, 560);
}
