import { tiersFor, type BillingCycle, type Tier } from './pricing.ts';

// Confirmed USD reference amounts, in minor-unit strings. These do not create
// or change Paddle products/prices, tax settings, trials or checkout behavior.
export const CONFIRMED_USD_PRICES: Record<Tier['name'], Record<BillingCycle, string>> = {
  Lite: { month: '199', year: '1990' },
  Standard: { month: '399', year: '3990' },
  Advanced: { month: '999', year: '9990' },
  Ultimate: { month: '1999', year: '19990' }
};
export const PUBLIC_PLANS = tiersFor(undefined).map(({ priceId: _unusedPriceIds, ...tier }) => ({
  ...tier, currency: 'USD' as const, amount: CONFIRMED_USD_PRICES[tier.name], trialDays: tier.name === 'Lite' ? 7 : null
}));
