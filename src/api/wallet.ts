import { isTestSession, request, type Page } from './platform';

export interface NTokenWallet {
  balance: number;
  amountUnit: 'integer';
  ledger: 'nexa_d1_ntoken_v1';
  paidCheckoutEnabled: false;
  topUpEnabled: false;
  refundsEnabled: false;
  transfersEnabled: false;
}
export interface NTokenEntry { order_id: string; delta: number; created_at: string }
const emptyWallet: NTokenWallet = { balance: 0, amountUnit: 'integer', ledger: 'nexa_d1_ntoken_v1',
  paidCheckoutEnabled: false, topUpEnabled: false, refundsEnabled: false, transfersEnabled: false };

// One API contract for the store and account consumers. No client-selected owner,
// cached spendable balance, funding endpoint or connection to subscriptions.
export const ntokenWallet = {
  read: (): Promise<NTokenWallet> => isTestSession() ? Promise.resolve({ ...emptyWallet }) : request<NTokenWallet>('/wallet'),
  entries: (offset = 0): Promise<Page<NTokenEntry>> => isTestSession()
    ? Promise.resolve({ data: [], pagination: { limit: 50, offset: 0, total: 0 } })
    : request<Page<NTokenEntry>>('/wallet/entries?' + new URLSearchParams({ limit: '50', offset: String(offset) }))
};
