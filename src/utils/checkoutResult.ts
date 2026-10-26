export const TEST_ORDER_STATUSES = ['pending', 'confirmed', 'inactive', 'review', 'revoked'] as const;
export type TestOrderStatus = typeof TEST_ORDER_STATUSES[number];
export interface TestOrderResult { intentId: string; offerId: string; amountMinor: string; currency: 'USD'; status: TestOrderStatus; canResume?: boolean; canCancel?: boolean; createdAt: number; validUntil: number | null }
export interface TestOrderResults { provider: 'waffo'; mode: 'test'; productionAccess: false; orders: TestOrderResult[] }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function parseTestReturn(search: string): { valid: boolean; intentId: string | null } {
  const params = new URLSearchParams(search);
  if (params.getAll('provider').length !== 1 || params.getAll('mode').length !== 1 || params.get('provider') !== 'waffo' || params.get('mode') !== 'test' || params.getAll('intent').length > 1) return { valid: false, intentId: null };
  const intentId = params.get('intent');
  return { valid: intentId === null || uuid.test(intentId), intentId };
}
export function testOrderResults(value: unknown): TestOrderResults {
  const data = value as Partial<TestOrderResults> | null;
  if (data?.provider !== 'waffo' || data.mode !== 'test' || data.productionAccess !== false || !Array.isArray(data.orders) || data.orders.length > 20) throw new Error('Invalid test order response');
  for (const row of data.orders) {
    if (!row || typeof row.intentId !== 'string' || !uuid.test(row.intentId) || typeof row.offerId !== 'string' || row.offerId.length > 160 || row.currency !== 'USD'
      || typeof row.amountMinor !== 'string' || !/^[0-9]{1,12}$/.test(row.amountMinor) || !TEST_ORDER_STATUSES.includes(row.status)
      || row.canResume !== undefined && typeof row.canResume !== 'boolean' || row.canCancel !== undefined && typeof row.canCancel !== 'boolean'
      || !Number.isSafeInteger(row.createdAt) || row.validUntil !== null && !Number.isSafeInteger(row.validUntil)) throw new Error('Invalid test order response');
  }
  return data as TestOrderResults;
}

export function parseBillingReturn(search: string): { valid: boolean; mode: 'test' | 'prod'; intentId: string | null } {
  const params = new URLSearchParams(search), mode = params.get('mode') === 'prod' ? 'prod' : 'test';
  if (mode === 'test') return { ...parseTestReturn(search), mode };
  const intentId = params.get('intent');
  return { mode, intentId, valid: params.getAll('provider').length === 1 && params.get('provider') === 'waffo' && params.getAll('mode').length === 1 && params.getAll('intent').length <= 1 && (intentId === null || uuid.test(intentId)) };
}
export interface BillingOrderResults { provider: 'waffo'; mode: 'test' | 'prod'; productionAccess: boolean; orders: (Omit<TestOrderResult, 'currency'> & { currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'HKD' })[] }
export function billingOrderResults(value: unknown, mode: 'test' | 'prod'): BillingOrderResults {
  if (mode === 'test') return testOrderResults(value);
  const data = value as Partial<BillingOrderResults> | null;
  if (data?.provider !== 'waffo' || data.mode !== 'prod' || data.productionAccess !== true || !Array.isArray(data.orders) || data.orders.length > 20) throw new Error('Invalid production order response');
  // Reuse the same identity/status/time checks; currency is independently bounded.
  for (const order of data.orders) {
    if (!['USD', 'EUR', 'GBP', 'JPY', 'HKD'].includes(order?.currency)) throw new Error('Invalid order currency');
    testOrderResults({ provider: 'waffo', mode: 'test', productionAccess: false, orders: [{ ...order, currency: 'USD' }] });
  }
  return data as BillingOrderResults;
}
