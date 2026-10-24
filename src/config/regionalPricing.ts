import type { BillingCycle, Tier } from './pricing.ts';
// User-approved display amounts. No FX conversion or payment-provider writes.
export const REGIONAL_MONTHLY = {
  USD: ['1.99', '3.99', '9.99', '19.99'], CNY: ['12.99', '26.99', '66.99', '132.99'],
  EUR: ['1.79', '3.59', '8.99', '17.99'], GBP: ['1.49', '2.99', '7.49', '14.99'],
  JPY: ['310', '630', '1570', '3130'], HKD: ['15.90', '31.90', '78.90', '156.90'],
  TWD: ['65', '130', '325', '650'], KRW: ['2600', '5300', '13200', '26500'],
  CAD: ['2.79', '5.59', '13.99', '27.99'], AUD: ['2.79', '5.69', '14.19', '28.49'], SGD: ['2.59', '5.09', '12.79', '25.59']
} as const;
export type RegionalCurrency = keyof typeof REGIONAL_MONTHLY;
export const REGIONAL_CURRENCIES = Object.keys(REGIONAL_MONTHLY) as RegionalCurrency[];
export const SUPPORTED_SUBSCRIPTION_CURRENCIES = new Set<RegionalCurrency>(['USD', 'EUR', 'GBP', 'JPY', 'HKD']);
export function regionalAmount(name: Tier['name'], currency: RegionalCurrency, cycle: BillingCycle): string {
  const index = ['Lite', 'Standard', 'Advanced', 'Ultimate'].indexOf(name);
  if (index < 0 || !REGIONAL_CURRENCIES.includes(currency)) throw new Error('Unknown regional offer');
  const amount = REGIONAL_MONTHLY[currency][index];
  if (cycle === 'month') return amount;
  const [whole, fraction = ''] = amount.split('.');
  const digits = fraction.length, value = BigInt(whole + fraction) * 10n;
  if (!digits) return value.toString();
  const scale = 10n ** BigInt(digits);
  return `${value / scale}.${(value % scale).toString().padStart(digits, '0')}`;
}
const euro = new Set('AD AT AX BE BG BL CY DE EE ES FI FR GF GP GR HR IE IT LT LU LV MC ME MF MQ MT NL PM PT RE SI SK SM TF VA XK YT'.split(' '));
export function regionalCurrencyFor(country: unknown): RegionalCurrency {
  if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) return 'USD';
  if (euro.has(country)) return 'EUR';
  if (['GB', 'GG', 'GI', 'IM', 'JE'].includes(country)) return 'GBP';
  return ({ CN: 'CNY', JP: 'JPY', HK: 'HKD', TW: 'TWD', KR: 'KRW', CA: 'CAD', AU: 'AUD', SG: 'SGD' } as Record<string, RegionalCurrency>)[country] || 'USD';
}

// Browser locale is a display hint, never proof of residence or billing country.
export function browserRegionalPricing(languages: readonly string[]) {
  let country: string | undefined;
  for (const language of languages) {
    try { country = new Intl.Locale(language).region; } catch { continue; }
    if (country) break;
  }
  const requestedCurrency = regionalCurrencyFor(country);
  const currency = SUPPORTED_SUBSCRIPTION_CURRENCIES.has(requestedCurrency) ? requestedCurrency : 'USD';
  return { currency, fallback: currency !== requestedCurrency };
}
