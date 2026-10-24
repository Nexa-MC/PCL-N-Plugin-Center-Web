import { tiersFor, type BillingCycle, type Tier } from './pricing.ts';

// Confirmed USD reference amounts, in minor-unit strings. These do not create
// or change Paddle products/prices, tax settings, trials or checkout behavior.
export const CONFIRMED_USD_PRICES: Record<Tier['name'], Record<BillingCycle, string>> = {
  Lite: { month: '99', year: '990' },
  Standard: { month: '299', year: '2999' },
  Advanced: { month: '799', year: '7999' },
  Ultimate: { month: '1799', year: '17999' }
};
export const PUBLIC_PLANS = tiersFor(undefined).map(({ priceId: _unusedPriceIds, ...tier }) => ({
  ...tier, currency: 'USD' as const, amount: CONFIRMED_USD_PRICES[tier.name], trialDays: tier.name === 'Lite' ? 7 : null
}));
