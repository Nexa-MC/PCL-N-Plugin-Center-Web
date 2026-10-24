const currencies = new Set(['USD', 'EUR', 'GBP', 'JPY', 'HKD']);
export interface WaffoReadiness { provider: 'waffo'; mode: 'prod'; checkoutEnabled: boolean; currencies: string[] }
export function waffoReadiness(value: unknown): WaffoReadiness {
  const row = value as Partial<WaffoReadiness> | null;
  if (row?.provider !== 'waffo' || row.mode !== 'prod' || typeof row.checkoutEnabled !== 'boolean' || !Array.isArray(row.currencies)
    || row.currencies.some(currency => !currencies.has(currency))) throw new Error('Invalid payment availability');
  return row as WaffoReadiness;
}
export function waffoRedirect(value: unknown, kind: 'checkout' | 'portal'): string {
  const row = value as { provider?: string; mode?: string; checkoutUrl?: string; portalUrl?: string; expiresAt?: string } | null;
  if (row?.provider !== 'waffo' || row.mode !== 'prod' || !Number.isFinite(Date.parse(row.expiresAt || '')) || Date.parse(row.expiresAt!) <= Date.now()) throw new Error('Invalid payment redirect');
  const url = new URL((kind === 'portal' ? row.portalUrl : row.checkoutUrl) || '');
  if (url.origin !== 'https://pancake.waffo.ai' || url.username || url.password || url.search
    || !/^#token=[A-Za-z0-9_.-]+$/.test(url.hash)
    || !(kind === 'portal' ? /^\/consumer\/portal\/store\/STO_[A-Za-z0-9]+$/ : /^\/store\/[^/]+\/checkout\/[A-Za-z0-9_-]+$/).test(url.pathname)) throw new Error('Invalid payment destination');
  return url.href;
}
