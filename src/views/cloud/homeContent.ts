// NexaCL homepage copy. Both languages share one type, so a missing or extra key in
// either language fails `vue-tsc`, and scripts/home-content.test.mjs checks the rest.
// Written for players: say what NexaCL does for them, not how it is built.

export interface Tile { title: string; body: string }
export interface StatItem { value: number; label: string }
export interface FaqItem { q: string; a: string }
export type StatusState = 'done' | 'wip' | 'later';
export interface StatusRow { label: string; state: StatusState; text: string }

export interface HomeCopy {
  seo: { title: string; description: string };
  hero: { badge: string; title: string; sub: string; download: string; changelog: string; build: string; platforms: string };
  window: { aria: string; profile: string; offline: string; switchProfile: string; version: string; launch: string; tagline: string; caption: string };
  stats: { aria: string; items: [StatItem, StatItem, StatItem, StatItem] };
  features: {
    eyebrow: string; title: string; sub: string;
    launch: Tile & { steps: [string, string, string, string] };
    java: Tile; downloads: Tile; updates: Tile; accounts: Tile;
    install: Tile & { chips: [string, string, string, string, string] };
    mods: Tile; recovery: Tile;
  };
  platforms: { aria: string; title: string; formats: string; gpg: string; sign: string };
  trust: { eyebrow: string; title: string; sub: string; items: [Tile, Tile, Tile] };
  status: { badge: string; title: string; body: string; rows: [StatusRow, StatusRow, StatusRow, StatusRow]; feedback: string };
  legacy: { tag: string; title: string; body: string; link: string };
  faq: { eyebrow: string; title: string; items: [FaqItem, FaqItem, FaqItem, FaqItem, FaqItem, FaqItem] };
  cta: { eyebrow: string; title: string; body: string; download: string; legacy: string; fine: string };
}

export const en: HomeCopy = {
  seo: {
    title: 'NexaCL — The Minecraft launcher that asks less from you',
    description: 'NexaCL (formerly PCL N) is the next-generation community Minecraft launcher for Windows, macOS and Linux. Java, downloads, updates, accounts and recovery are handled for you. Try the 2.0 Alpha or stay on 1.4.x.',
  },
  hero: {
    badge: 'NexaCL 2.0 Alpha',
    title: 'The Minecraft launcher that asks less from you.',
    sub: 'Pick a profile, pick a version, press Launch. NexaCL finds the right Java, downloads what’s missing and keeps itself up to date, so you can get on with playing.',
    download: 'Download 2.0 Alpha',
    changelog: 'What’s new',
    build: 'Current build',
    platforms: 'Windows, macOS and Linux · x64 and ARM64',
  },
  window: {
    aria: 'Illustration of the NexaCL launcher layout',
    profile: 'Profile',
    offline: 'Offline profile',
    switchProfile: 'Switch profile',
    version: 'Version',
    launch: 'Launch game',
    tagline: 'Your next game starts here.',
    caption: 'Interface illustration. The Alpha interface may change.',
  },
  stats: {
    aria: 'NexaCL at a glance',
    items: [
      { value: 3, label: 'platforms: Windows, macOS and Linux' },
      { value: 2, label: 'processor types: x64 and ARM64' },
      { value: 4, label: 'Java versions matched for you (8, 17, 21, 25)' },
      { value: 1, label: 'click to upgrade from 1.4.x to 2.0' },
    ],
  },
  features: {
    eyebrow: 'Why you’ll like it',
    title: 'The chores are ours. The game is yours.',
    sub: 'Everything that happens before the game starts, handled.',
    launch: {
      title: 'Launch Minecraft',
      body: 'Choose a profile and a version. NexaCL finds your installed games, picks the right Java, prepares the files the game needs and records what happens while it runs, so if something crashes you can see why.',
      steps: ['Find your game', 'Pick Java', 'Prepare files', 'Keep a log'],
    },
    java: {
      title: 'Java? Handled.',
      body: 'Java 8, 17, 21 and 25 are downloaded when needed and matched to each game version. No more hunting for paths.',
    },
    downloads: {
      title: 'Cut off? Keep going.',
      body: 'Interrupted downloads pick up where they stopped, large files arrive in parts, and a broken source is swapped for another. Follow every task in one list, and pause or cancel whenever you like.',
    },
    updates: {
      title: 'Updates, minus the fuss.',
      body: 'NexaCL chooses a full package or a smaller patch for you and checks every file before installing it. From 1.4.x you can upgrade straight to 2.0.',
    },
    accounts: {
      title: 'Accounts and looks.',
      body: 'Sign in with Microsoft, Yggdrasil or LittleSkin. Skins and capes are being added, and your sign-in details stay in your system’s secure storage.',
    },
    install: {
      title: 'Drop it in. Done.',
      body: 'Drag a file onto the window to install it. If an import fails, nothing is left half-installed.',
      chips: ['MRPACK', 'CurseForge ZIP', 'Mod JARs', 'Forge / NeoForge / OptiFine', 'Game folders'],
    },
    mods: {
      title: 'Mods, organized.',
      body: 'Filter by category, switch mods on or off in place, check for updates known to be compatible, and search for resources without leaving the launcher.',
    },
    recovery: {
      title: 'Broke it? Roll back.',
      body: 'Every successful launch saves a snapshot. If a change breaks your game, see what changed and roll back one item at a time or all at once.',
    },
  },
  platforms: {
    aria: 'Platforms',
    title: 'Three platforms. Every architecture.',
    formats: 'Installers (EXE, MSI, DMG, DEB, RPM, AppImage) and portable archives for x64 and ARM64.',
    gpg: 'GPG signed',
    sign: 'Every package comes with a checksum and a signature, so you can verify where it came from.',
  },
  trust: {
    eyebrow: 'Built to be trusted',
    title: 'Safe by default.',
    sub: 'How NexaCL treats your files, your accounts and your data.',
    items: [
      { title: 'Checked before it’s installed', body: 'Every file in an update is verified before it is installed, and release packages are signed so you can confirm where they came from.' },
      { title: 'Sign-in details stay protected', body: 'Your account credentials are kept in your system’s secure storage instead of ordinary settings files.' },
      { title: 'Open source, and local', body: 'NexaCL is built by the community under the Apache-2.0 license. Your game data stays on your computer, and telemetry never includes log contents.' },
    ],
  },
  status: {
    badge: 'Alpha',
    title: 'Usable, not finished.',
    body: 'NexaCL 2.0 is in Alpha. You can try it today, but some pages are still being built and things can change. Back up your saves before you start.',
    rows: [
      { label: 'Downloads, updates and accounts', state: 'done', text: 'Mostly complete' },
      { label: 'Installing and launching games', state: 'wip', text: 'Being polished' },
      { label: 'Instance, mod and world tools', state: 'wip', text: 'In progress' },
      { label: 'Plugins', state: 'later', text: 'Up next' },
    ],
    feedback: 'Share feedback on GitHub',
  },
  legacy: {
    tag: 'PCL N 1.4.x',
    title: 'Just want to play?',
    body: '1.4.x stays the stable version during the Alpha, so there’s no need to switch. NexaCL 2.0 takes over once it’s finished and has passed the final checks.',
    link: 'Download PCL N 1.4.x',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Straight answers.',
    items: [
      { q: 'Is NexaCL the same as PCL N?', a: 'NexaCL is the next generation of PCL N. PCL N 1.x is the earlier stable version. Some early Alpha download files still have “Nexa” in their names; that will be made consistent later.' },
      { q: 'Should I use the Alpha now?', a: 'If you want an early look at 2.0 and don’t mind pages and behavior still changing, give it a try. If you just want to play without surprises, stay on 1.4.x.' },
      { q: 'Has NexaCL 2.0 replaced PCL N 1.4.x?', a: 'Not yet. 1.4.x stays the stable version during the Alpha. NexaCL 2.0 takes over only after it is finished and has passed the final checks.' },
      { q: 'Can I upgrade from 1.4.x?', a: 'Yes. The updater moves 1.4.x straight to 2.0. Once you are on 2.0 it does not offer a downgrade, so back up your data first.' },
      { q: 'Which systems does it run on?', a: 'Windows, macOS and Linux, on both x64 and ARM64 processors. Pick an installer or a portable archive on the download page.' },
      { q: 'Is NexaCL open source?', a: 'Yes. It is built by the community under the Apache-2.0 license, and the source code is public on GitHub.' },
    ],
  },
  cta: {
    eyebrow: 'NexaCL 2.0 Alpha',
    title: 'Ready to try NexaCL?',
    body: 'The Alpha moves fast, and every piece of feedback shapes the next build.',
    download: 'Download NexaCL 2.0 Alpha',
    legacy: 'Stay on PCL N 1.4.x',
    fine: 'Built by the community',
  },
};

export const zh: HomeCopy = {
  seo: {
    title: 'NexaCL — 一个更省心的 Minecraft 启动器',
    description: 'NexaCL（原 PCL N）是新一代社区 Minecraft 启动器，支持 Windows、macOS 和 Linux。Java、下载、更新、账号与崩溃恢复都替你处理。体验 2.0 Alpha，或继续使用 1.4.x 稳定版。',
  },
  hero: {
    badge: 'NexaCL 2.0 Alpha',
    title: '一个更省心的 Minecraft 启动器。',
    sub: '选好档案和版本，点一下启动。合适的 Java、缺少的文件，以及启动器自身的更新，都由 NexaCL 替你处理，你只管玩。',
    download: '下载 2.0 Alpha',
    changelog: '看看新在哪',
    build: '当前测试版本',
    platforms: 'Windows / macOS / Linux · x64 与 ARM64',
  },
  window: {
    aria: 'NexaCL 启动器布局示意',
    profile: '档案',
    offline: '离线档案',
    switchProfile: '切换档案',
    version: '版本',
    launch: '启动游戏',
    tagline: '下一次游戏，从这里开始。',
    caption: '界面示意。Alpha 版本的界面仍会调整。',
  },
  stats: {
    aria: 'NexaCL 数字一览',
    items: [
      { value: 3, label: '个平台 · Windows / macOS / Linux' },
      { value: 2, label: '种处理器 · x64 与 ARM64' },
      { value: 4, label: '个 Java 版本自动匹配（8 / 17 / 21 / 25）' },
      { value: 1, label: '键升级 · 从 1.4.x 到 2.0' },
    ],
  },
  features: {
    eyebrow: '为什么你会喜欢它',
    title: '把麻烦留给启动器，把游戏留给你。',
    sub: '游戏开始之前的那些事，都替你处理好。',
    launch: {
      title: '启动 Minecraft',
      body: '选好档案和版本就行。NexaCL 会找到你已安装的游戏，配好合适的 Java，准备好游戏所需的文件，并在运行期间记录发生的事，崩溃了也能看到原因。',
      steps: ['找到游戏', '选好 Java', '准备文件', '记录运行'],
    },
    java: {
      title: 'Java？不用你管。',
      body: 'Java 8、17、21、25 按需自动下载，并按游戏版本自动匹配。不用再手动找路径。',
    },
    downloads: {
      title: '断网了？接着下。',
      body: '下载中断后可以接着下，大文件分段并行，来源失效会自动切换。所有任务集中在一个列表里，随时可以暂停或取消。',
    },
    updates: {
      title: '更新，少折腾。',
      body: '完整包还是小补丁，由 NexaCL 替你决定；每个文件安装前都会先验证。1.4.x 可以直接升级到 2.0。',
    },
    accounts: {
      title: '账号和外观。',
      body: '支持 Microsoft、Yggdrasil 和 LittleSkin 登录，皮肤与披风功能正在补齐，登录凭据保存在系统的安全存储中。',
    },
    install: {
      title: '拖进来，就能装。',
      body: '把文件拖到窗口上即可安装。导入失败时，不会留下装了一半的内容。',
      chips: ['MRPACK', 'CurseForge ZIP', '模组 JAR', 'Forge / NeoForge / OptiFine', '游戏文件夹'],
    },
    mods: {
      title: '模组，管得清楚。',
      body: '按分类筛选，就地启用或停用，更新前先确认兼容性，还能直接搜索资源，不用离开启动器。',
    },
    recovery: {
      title: '装坏了？退回来。',
      body: '每次成功启动都会保存一份快照。改坏了可以查看改动清单，逐项或一键退回到上次正常的状态。',
    },
  },
  platforms: {
    aria: '支持的平台',
    title: '三个平台，每种架构。',
    formats: '安装包（EXE / MSI / DMG / DEB / RPM / AppImage）与便携包，覆盖 x64 与 ARM64。',
    gpg: 'GPG 签名',
    sign: '每个安装包都附校验值与签名，来源可验证。',
  },
  trust: {
    eyebrow: '值得信任',
    title: '默认就安全。',
    sub: 'NexaCL 如何对待你的文件、账号和数据。',
    items: [
      { title: '先验证，再安装', body: '更新里的每个文件都会先验证再安装；发布包带有签名，可以确认来源。' },
      { title: '登录凭据受保护', body: '账号凭据保存在系统的安全存储中，而不是普通的设置文件里。' },
      { title: '开源，数据留在本地', body: 'NexaCL 由社区开发，采用 Apache-2.0 许可。游戏数据留在你的电脑上，遥测不会采集日志内容。' },
    ],
  },
  status: {
    badge: 'Alpha',
    title: '能用了，但还没做完。',
    body: 'NexaCL 2.0 目前处于 Alpha 阶段，现在就可以体验，但部分页面仍在开发，功能也可能变化。开始之前，请先备份存档。',
    rows: [
      { label: '下载、更新和账号', state: 'done', text: '主要部分已完成' },
      { label: '安装与启动游戏', state: 'wip', text: '正在打磨' },
      { label: '实例、模组和存档工具', state: 'wip', text: '正在做' },
      { label: '插件', state: 'later', text: '后面再做' },
    ],
    feedback: '前往 GitHub 反馈问题',
  },
  legacy: {
    tag: 'PCL N 1.4.x',
    title: '只想稳定玩游戏？',
    body: 'Alpha 期间，PCL N 1.4.x 仍然是稳定版本，不必急着更换。等 NexaCL 2.0 做完并通过最终检查后，才会正式接替它。',
    link: '下载 PCL N 1.4.x',
  },
  faq: {
    eyebrow: '常见问题',
    title: '先把问题说清楚。',
    items: [
      { q: 'NexaCL 和 PCL N 是同一个启动器吗？', a: 'NexaCL 是 PCL N 的下一代，PCL N 1.x 是前身稳定版。部分早期测试包的文件名仍带有“Nexa”字样，后续会统一。' },
      { q: '我现在适合用 Alpha 吗？', a: '想提前体验 2.0、能接受页面和功能还会变化，可以试试 Alpha；只想稳稳当当玩游戏，继续用 1.4.x 更合适。' },
      { q: 'NexaCL 2.0 已经取代 PCL N 1.4.x 了吗？', a: '还没有。Alpha 期间 1.4.x 仍是稳定版本；等 2.0 做完并通过最终检查后，才会正式接替。' },
      { q: '1.4.x 能直接升级吗？', a: '可以。更新功能支持从 1.4.x 直接升级到 2.0；升级到 2.0 后不提供降级，请先备份数据。' },
      { q: '支持哪些系统？', a: '支持 Windows、macOS 和 Linux，x64 与 ARM64 处理器均可。在下载页选择安装包或便携包即可。' },
      { q: 'NexaCL 是开源的吗？', a: '是的。NexaCL 由社区开发，采用 Apache-2.0 许可，源代码在 GitHub 公开。' },
    ],
  },
  cta: {
    eyebrow: 'NexaCL 2.0 Alpha',
    title: '准备好试试 NexaCL 了吗？',
    body: 'Alpha 正在快速迭代，你的每一条反馈都会影响下一个版本。',
    download: '下载 NexaCL 2.0 Alpha',
    legacy: '继续用 PCL N 1.4.x',
    fine: '由社区开发',
  },
};

export const homeCopy = (locale: string): HomeCopy => (locale === 'zh' ? zh : en);
