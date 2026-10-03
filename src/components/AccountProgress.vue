<template>
  <section class="work-panel progression-panel">
    <div class="section-heading"><h2>{{ $ui("等级与经验") }}</h2><button class="secondary-button" :disabled="busy" @click="$emit('refresh')">{{ $ui("刷新") }}</button></div>
    <p v-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
    <p v-if="!progression && !error" role="status">{{ $ui("正在读取…") }}</p>
    <template v-if="progression">
      <div class="level-line"><strong>{{ $ui(progression.display.label) }}</strong><span v-if="progression.display.kind === 'badge'">{{ $ui("账户 Lv") }}{{ progression.level }}</span><span>{{ progression.xp.toLocaleString($locale) }} Exp<template v-if="progression.next?.threshold"> / {{ progression.next.threshold.toLocaleString($locale) }}</template></span></div>
      <progress :value="percent" max="100" :aria-label="$ui('账户升级进度')" />
      <p class="level-hint">{{ progression.level === 0 ? $ui("使用登录当前账户的启动器启动一次游戏，解锁 Lv1。") : progression.next ? $ui("距离 Lv{0} 还需 {1} Exp", [progression.next.level, progression.next.remaining?.toLocaleString($locale)]) : $ui("已达到 Lv7") }}</p>
      <div class="activity-line"><span>{{ $ui("今日") }} {{ progression.activity.todayXp }} / {{ progression.rewards.dailyCap }} Exp</span><span>MC {{ (progression.activity.gameSeconds / 3600).toFixed(1) }}h</span><span>{{ $ui("连续启动") }} {{ progression.activity.currentStreak }} {{ $ui("天") }}</span></div>
      <details class="badge-details"><summary>{{ $ui("铭牌") }} <span>{{ progression.badges.filter(b => b.earned).length }} / {{ progression.badges.length }}</span></summary>
        <button v-if="progression.display.badgeId" class="secondary-button" :disabled="busy" @click="$emit('select', null)">{{ $ui("显示 Lv") }}{{ progression.level }}</button>
        <div class="badge-grid"><article v-for="badge in progression.badges" :key="badge.id" :class="{ earned: badge.earned }"><div><strong>{{ $ui(badge.name) }}</strong><span v-if="badge.earned" class="status-pill">{{ $ui("已获得") }}</span></div><p>{{ $ui(badge.requirement) }}</p><small>{{ $ui(badge.progress) }}</small><button v-if="badge.earned && badge.replacesLevel" class="secondary-button" :disabled="busy || progression.display.badgeId === badge.id" :aria-pressed="progression.display.badgeId === badge.id" @click="$emit('select', badge.id)">{{ progression.display.badgeId === badge.id ? $ui("正在展示") : $ui("替代等级展示") }}</button></article></div>
      </details>
      <details class="reward-details"><summary>{{ $ui("经验规则") }}</summary><p>{{ $ui("每日登录启动器 +") }}{{ progression.rewards.launcherLogin }} {{ $ui("· 每日首次启动游戏 +") }}{{ progression.rewards.firstGameStart }}<br>{{ $ui("游戏在线每分钟 +1 · 启动器在线每") }} {{ progression.rewards.launcherMinutes }} {{ $ui("分钟 +1") }}<br>{{ $ui("每日上限") }} {{ progression.rewards.dailyCap }} {{ $ui("Exp，按北京时间计算。") }}</p></details>
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { AccountProgression } from '@/api/platform';
const props = defineProps<{ progression?: AccountProgression; busy: boolean; error: string }>();
defineEmits<{ refresh: []; select: [badgeId: string | null] }>();
const thresholds = [0, 0, 2000, 5000, 10000, 20000, 50000, 100000];
const percent = computed(() => { const p = props.progression; if (!p?.level) return 0; if (!p.next) return 100; const base = thresholds[p.level] ?? 0; return Math.min(100, Math.max(0, (p.xp - base) / ((p.next.threshold ?? 0) - base) * 100)); });
</script>
<style scoped>
.level-line{display:flex;align-items:baseline;flex-wrap:wrap;gap:12px;margin:22px 0 12px}.level-line strong{font-size:28px;color:var(--nc-accent)}.level-line span{font-size:13px;color:var(--market-muted)}.level-line span:last-child{margin-left:auto;font-variant-numeric:tabular-nums}progress{display:block;appearance:none;width:100%;height:8px;border:0;border-radius:99px;overflow:hidden;background:var(--market-surface-soft);accent-color:var(--nc-accent)}progress::-webkit-progress-bar{background:var(--market-surface-soft)}progress::-webkit-progress-value{background:var(--nc-accent);border-radius:99px}progress::-moz-progress-bar{background:var(--nc-accent)}.level-hint{font-size:12px;color:var(--market-muted);margin-top:10px}.activity-line{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:var(--market-muted);margin:18px 0}details{border-top:1px solid var(--market-border);padding-top:16px;margin-top:16px}summary{cursor:pointer;font-size:13px;font-weight:600}summary span{color:var(--market-muted);font-weight:400;margin-left:8px}.badge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.badge-grid article{padding:16px;border:1px solid var(--market-border);border-radius:10px;background:var(--market-surface-soft);color:var(--market-muted)}.badge-grid article.earned{color:var(--market-text)}.badge-grid article>div{display:flex;align-items:center;justify-content:space-between;gap:8px}.badge-grid p,.reward-details p{font-size:12px;line-height:1.7;margin-top:10px}.badge-grid small{display:block;font-size:11px;margin:6px 0}.badge-grid .secondary-button{margin-top:10px}.reward-details p{color:var(--market-muted)}@media(max-width:600px){.badge-grid{grid-template-columns:1fr}.activity-line{gap:10px}}
</style>
