// Cloud+ 套餐配置：修改档位、文案或价格 ID 只需要改这个文件。
// priceId 填 Paddle 后台中实际创建的价格 ID（pri_ 开头），月付/年付各一个。
// 未填写的档位不会渲染结账按钮，避免与 Paddle 账户中的真实定价不一致。
export interface Tier {
  name: 'Lite' | 'Standard' | 'Advanced' | 'Ultimate';
  description: string;
  features: string[];
  highlight?: boolean;
  priceId: { month: string; year: string };
}

const SANDBOX_TIERS: Tier[] = [
  {
    name: 'Lite',
    description: '轻度使用，先体验 Cloud+ 的核心能力。',
    features: ['7 天免费试用（每账户一次）', '基础云空间容量', '多设备数据同步', '社区支持'],
    priceId: { month: 'pri_01m3e0z6ggepqw2wegf3xgt1w6', year: 'pri_01m3e0z6mx9mdsbbqtw0q0tm6y' }
  },
  {
    name: 'Standard',
    description: '日常游玩的均衡选择。',
    features: ['包含 Lite 全部权益', '更大云空间容量', '基础 AI 配额', '工单优先处理'],
    priceId: { month: 'pri_01m3e0z6rsgpc0t00w74w3taxx', year: 'pri_01m3e0z6xw2sh7xax1s1hr0vgg' }
  },
  {
    name: 'Advanced',
    description: '重度玩家与内容创作者。',
    features: ['包含 Standard 全部权益', '大容量云空间', '更高 AI 配额', '多份档案同步'],
    highlight: true,
    priceId: { month: 'pri_01m3e0z73c36e9kn5kbj4b3z7f', year: 'pri_01m3e0z779tb5tkj92z7yb5v30' }
  },
  {
    name: 'Ultimate',
    description: '为进阶用户准备的全量权益。',
    features: ['包含 Advanced 全部权益', '最大云空间与加购折扣', 'AI 配额加量包资格', '优先支持通道'],
    priceId: { month: 'pri_01m3e0z7akgat4mwpcvyph3aya', year: 'pri_01m3e0z7e1tpn0c4188b62pcg5' }
  }
];

export type BillingCycle = 'month' | 'year';

// Sandbox IDs never cross into a live build. Live IDs come from the audited
// live catalog, supplied at build time; an incomplete catalog stays unavailable.
export function tiersFor(environment: string | undefined, settings: Record<string, string | undefined> = {}): Tier[] {
  const sandboxIds = new Set(SANDBOX_TIERS.flatMap(tier => Object.values(tier.priceId)));
  return SANDBOX_TIERS.map(tier => ({
    ...tier,
    priceId: Object.fromEntries((['month', 'year'] as const).map(cycle => {
      const candidate = settings[`VITE_PADDLE_PRICE_${tier.name.toUpperCase()}_${cycle.toUpperCase()}`] || '';
      return [cycle, environment === 'sandbox' ? tier.priceId[cycle]
        : environment === 'production' && /^pri_[a-z0-9]{26}$/.test(candidate) && !sandboxIds.has(candidate) ? candidate : ''];
    })) as Tier['priceId']
  }));
}
