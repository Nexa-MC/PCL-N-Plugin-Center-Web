import { request, isTestSession, ApiError } from './platform';
export interface LauncherRolloutRule {
  id: string; kind: "update" | "feature"; target: string; basisPoints: number;
  channels: string[]; rids: string[]; expiresAt: string; enabled: boolean;
}
export interface LauncherRolloutPolicy { revision: number; rules: LauncherRolloutRule[] }
export interface LauncherDiagnostics {
  days: number; since: string; until: string; generatedAt: string;
  histograms: { metric: string; bucket: number; count: number; total: number; min: number; max: number }[];
  trends: { day: string; metric: string; mean: number; peak: number; count: number }[];
  errors: { fingerprint: string; category: string; severity: string; code: string; stack: string; last_seen: string; count: number; issue_number: number | null; issue_state: string | null; issue_updated: string | null }[];
  features: { feature: string; event: string; count: number }[];
  sessions: number; sync: { last_attempt: string; last_success: string | null; status: string } | null;
  featureCatalog: string[]; metricCatalog: string[];
}

// ---------- 测试账户本地桩数据 ----------
// 仅当 test_login() 的前端测试会话生效时使用：数据全部本地生成，
// 用于预览遥测/诊断/灰度界面，不来自也不触达真实采集后端。
const wait = (ms = 140) => new Promise<void>(resolve => setTimeout(resolve, ms));
const dayList = (days: number): string[] => Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
const wave = (seed: number, i: number) => 1 + 0.32 * Math.sin((i + seed) * 1.7) + ((i * 7 + seed * 13) % 11) / 40;
const stamp = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString().slice(0, 16).replace('T', ' ');

const testEvents = ['app.started', 'game.started', 'game.exited', 'task.finished', 'update.checked', 'diagnostic.session', 'diagnostic.metric', 'diagnostic.error'];
const testFeatureCatalog = ['launch', 'install', 'versions', 'accounts', 'settings', 'tasks', 'downloads', 'updates', 'wardrobe'];
const testMetricBase: Record<string, [number, number]> = {
  'network.request.ms': [90, 700], 'jvm.launch.ms': [2600, 9200], 'catalog.normalize.ms': [6, 90],
  'scheduler.duration.ms': [1, 38], 'dispatch.launch.ms': [40, 420], 'dispatch.downloads.ms': [18, 260],
  'launcher.working_set.mib': [360, 1500], 'launcher.private.mib': [280, 1200], 'launcher.managed.mib': [110, 560],
  'jvm.working_set.mib': [1300, 5400], 'launcher.cpu.percent': [3, 42],
  'catalog.results.count': [18, 420], 'catalog.input.count': [22, 540], 'catalog.cache.hit': [1, 2]
};
const testMetricCatalog = Object.keys(testMetricBase);

async function testTelemetry(days: number) {
  await wait();
  const list = dayList(days);
  const scale = Math.max(1, days / 7);
  return {
    days, since: list[0], until: list[list.length - 1], generatedAt: new Date().toISOString(),
    daily: list.flatMap((day, i) => testEvents.map((event, e) => ({
      day, event,
      result: event === 'diagnostic.error' ? 'error' : 'ok',
      count: Math.round((event === 'app.started' ? 120 : event === 'diagnostic.metric' ? 260 : 70) * scale * wave(e, i))
    }))),
    versions: [
      { version: '2.0.0.alpha.4', count: Math.round(540 * scale) },
      { version: '2.0.0.alpha.3', count: Math.round(210 * scale) },
      { version: '1.4.14', count: Math.round(860 * scale) }
    ],
    platforms: [
      { os: 'windows', arch: 'x64', count: Math.round(980 * scale) },
      { os: 'windows', arch: 'arm64', count: Math.round(64 * scale) },
      { os: 'macos', arch: 'arm64', count: Math.round(240 * scale) },
      { os: 'macos', arch: 'x64', count: Math.round(58 * scale) },
      { os: 'linux', arch: 'x64', count: Math.round(260 * scale) }
    ]
  };
}

function testHistograms(scale: number): LauncherDiagnostics['histograms'] {
  const rows: LauncherDiagnostics['histograms'] = [];
  for (const [metric, [lo, hi]] of Object.entries(testMetricBase)) {
    const mean = metric === 'catalog.cache.hit' ? 0.72 : (lo + hi) / 2.6;
    const base = Math.max(4, Math.round(52 * scale));
    for (let k = 0; k < 4; k++) {
      const bucket = Math.max(0, Math.ceil(Math.log2(mean)) - 2 + k);
      const count = Math.max(1, Math.round(base * [1, 1.6, 0.8, 0.25][k]));
      rows.push({ metric, bucket, count, total: count * mean * [0.7, 1, 1.35, 1.9][k], min: lo, max: metric === 'catalog.cache.hit' ? 1 : hi });
    }
  }
  return rows;
}

function testTrends(days: number): LauncherDiagnostics['trends'] {
  const keys = ['network.request.ms', 'jvm.launch.ms', 'launcher.working_set.mib', 'launcher.cpu.percent', 'catalog.normalize.ms'];
  return dayList(days).flatMap((day, i) => keys.map((metric, m) => {
    const [lo, hi] = testMetricBase[metric];
    const mean = (lo + hi) / 2.6 * wave(m, i);
    return { day, metric, mean: +mean.toFixed(2), peak: +(mean * 1.7).toFixed(2), count: 24 + ((i * 5 + m * 9) % 30) };
  }));
}

function testErrors(): LauncherDiagnostics['errors'] {
  return [
    { fingerprint: 'a1b2c3d4e5f60718', category: 'downloads', severity: 'error', code: 'java.net.SocketTimeoutException', stack: '测试堆栈：下载源连接超时\n  at Nexa.Services.Downloads.SegmentWorker.PumpAsync(…)\n  at Nexa.Services.Downloads.TransferCoordinator.RunAsync(…)', last_seen: stamp(5 * 36e5), count: 42, issue_number: 2801, issue_state: 'open', issue_updated: stamp(2 * 864e5) },
    { fingerprint: 'b2c3d4e5f6071829', category: 'launch', severity: 'error', code: 'ExitCode 1 · Duplicate key (BootstrapLauncher)', stack: '测试堆栈：类路径出现重复依赖 JAR\n  at Nexa.Jvm.Host.LaunchPlan.BuildClasspath(…)', last_seen: stamp(26 * 36e5), count: 17, issue_number: null, issue_state: null, issue_updated: null },
    { fingerprint: 'c3d4e5f607182930', category: 'updates', severity: 'warning', code: 'PatchSourceUnavailable', stack: '测试堆栈：补丁源暂不可用，已回退完整包\n  at Nexa.Services.Updates.PackagePlanner.ChooseAsync(…)', last_seen: stamp(3 * 864e5), count: 6, issue_number: 2794, issue_state: 'closed', issue_updated: stamp(4 * 864e5) }
  ];
}

async function testDiagnostics(days: number): Promise<LauncherDiagnostics> {
  await wait();
  const list = dayList(days);
  const sessions = Math.round(days * 23.5);
  return {
    days, since: list[0], until: list[list.length - 1], generatedAt: new Date().toISOString(),
    histograms: testHistograms(Math.max(1, days / 7)),
    trends: testTrends(days),
    errors: testErrors(),
    features: testFeatureCatalog.flatMap((feature, f) => [
      { feature, event: 'feature.used', count: Math.max(1, Math.round(sessions * (0.72 - f * 0.06))) },
      { feature, event: 'feature.invoked', count: Math.max(2, Math.round(sessions * (1.6 - f * 0.12))) }
    ]),
    sessions,
    sync: { last_attempt: stamp(35 * 6e4), last_success: stamp(2 * 36e5), status: 'ok' },
    featureCatalog: testFeatureCatalog,
    metricCatalog: testMetricCatalog
  };
}

async function testRunSummary() {
  await wait();
  return {
    groups: [
      { version: '2.0.0.alpha.4', os: 'windows', loader: 'Fabric', runs: 26, ended: 23, elapsed: 5420, peak: 3380 },
      { version: '2.0.0.alpha.4', os: 'windows', loader: 'Vanilla', runs: 14, ended: 14, elapsed: 4210, peak: 2450 },
      { version: '2.0.0.alpha.3', os: 'macos', loader: 'Fabric', runs: 9, ended: 7, elapsed: 6100, peak: 3720 },
      { version: '1.4.14', os: 'linux', loader: 'Forge', runs: 6, ended: 5, elapsed: 7240, peak: 4180 }
    ],
    settings: [
      { loader: 'Fabric', render: '12', simulation: '10', runs: 18, working: 3120 },
      { loader: 'Vanilla', render: '8', simulation: '8', runs: 11, working: 2260 },
      { loader: 'Forge', render: '16', simulation: '12', runs: 3, working: null }
    ],
    mods: [
      { id: 'fabric-api', version: '0.119.2', runs: 24 },
      { id: 'sodium', version: '0.6.13', runs: 21 },
      { id: 'lithium', version: '0.14.8', runs: 19 },
      { id: 'iris', version: '1.8.5', runs: 14 },
      { id: 'create', version: '6.0.6', runs: 7 }
    ]
  };
}

let testRollouts: LauncherRolloutPolicy = {
  revision: 3,
  rules: [
    { id: 'alpha-five', kind: 'update', target: '2.0.0.alpha.5', basisPoints: 2500, channels: ['alpha'], rids: ['win-x64', 'osx-arm64', 'linux-x64'], expiresAt: '2026-12-01T00:00:00Z', enabled: true },
    { id: 'compact-batches', kind: 'feature', target: 'telemetry.compact-batches', basisPoints: 5000, channels: ['alpha', 'beta'], rids: [], expiresAt: '2026-11-15T00:00:00Z', enabled: false }
  ]
};
const clonePolicy = (policy: LauncherRolloutPolicy): LauncherRolloutPolicy => ({ revision: policy.revision, rules: policy.rules.map(rule => ({ ...rule, channels: [...rule.channels], rids: [...rule.rids] })) });

const jsonBody = JSON.stringify;
export const pluginCenterApi = {
  launcherRunSummary: async (days: number, version = '', os = '') => {
    if (isTestSession()) return testRunSummary();
    return request<{groups:{version:string;os:string;loader:string;runs:number;ended:number;elapsed:number;peak:number|null}[];settings:{loader:string;render:string;simulation:string;runs:number;working:number|null}[];mods:{id:string;version:string;runs:number}[]}>(`/telemetry/run-summaries?days=${days}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`);
  },
  launcherRuns: async (days: number, version = '', os = '') => {
    if (isTestSession()) {
      await wait();
      return { runs: dayList(days).slice(-6).reverse().map((day, i) => ({ run: `run-test-${i + 1}`, version: '2.0.0.alpha.4', os: i % 2 ? 'windows' : 'linux', day, elapsed: 3600 + i * 420, ended: i % 3 ? 1 : 0, samples: 40 + i * 6 })) };
    }
    return request<{runs:{run:string;version:string;os:string;day:string;elapsed:number;ended:number;samples:number}[]}>(`/telemetry/runs?days=${days}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`);
  },
  launcherRun: async (run: string, after = -1) => {
    if (isTestSession()) {
      await wait();
      return { samples: [{ 'jvm.launch.ms': '4213', 'launcher.working_set.mib': '1180' }, { 'jvm.launch.ms': '4380', 'launcher.working_set.mib': '1242' }], mods: [{ id: 'sodium', version: '0.6.13' }], next: null };
    }
    return request<{samples:Record<string,string>[];mods:Record<string,string>[];next:number|null}>(`/telemetry/runs?run=${encodeURIComponent(run)}&after=${after}`);
  },
  launcherDiagnostics: async (days: number, version = "", os = "") => {
    if (isTestSession()) return testDiagnostics(days);
    return request<LauncherDiagnostics>(`/telemetry/diagnostics?${new URLSearchParams({ days: String(days), version, os })}`);
  },
  syncDiagnosticIssues: async () => {
    if (isTestSession()) { await wait(500); return { status: 'ok', linked: 2 }; }
    return request<{ status: string; linked?: number }>("/telemetry/issue-syncs", { method: "POST" });
  },
  launcherRollouts: async () => {
    if (isTestSession()) { await wait(); return clonePolicy(testRollouts); }
    return request<LauncherRolloutPolicy>("/rollout-policies/current");
  },
  saveLauncherRollouts: async (policy: LauncherRolloutPolicy) => {
    if (isTestSession()) {
      await wait(260);
      // 模拟 If-Match 并发冲突：revision 过期时拒绝保存，与真实后端行为一致。
      if (policy.revision !== testRollouts.revision) throw new ApiError('规则已被其他管理员更新，请重新读取后再保存。', 409);
      testRollouts = { revision: policy.revision + 1, rules: policy.rules.map(rule => ({ ...rule, channels: [...rule.channels], rids: [...rule.rids] })) };
      return clonePolicy(testRollouts);
    }
    return request<LauncherRolloutPolicy>("/rollout-policies/current", { method: "PUT", headers: { "If-Match": `"${policy.revision}"` }, body: jsonBody(policy) });
  },
  launcherTelemetry: async (days: number, level: string = "all", version = "", os = "") => {
    if (isTestSession()) return testTelemetry(days);
    return request<{
      days: number; since: string; until: string; generatedAt: string;
      daily: { day: string; event: string; result: string; count: number }[];
      versions: { version: string; count: number }[];
      platforms: { os: string; arch: string; count: number }[];
    }>(`/telemetry/summary?days=${days}&level=${encodeURIComponent(level)}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`);
  },
};
