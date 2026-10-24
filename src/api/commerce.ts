import { ApiError, isTestSession, request, type Page } from './platform';
import type { StoreProduct } from './store';

export interface RechargeLot { id: string; provider: string; provider_transaction_id: string; paid_at: string; tokens_issued: number; consumed_tokens: number; reserved_tokens: number; available_tokens: number }
export interface RefundQuote { currency: 'CNY'; grossFen: number; originalProviderFeeFen: number | null; feeDeductionFen: number | null; netFen: number | null;
  approvalBlockedReason: string | null; availableTokens: number; originalPayment: { provider: string; transactionId: string }; paymentsEnabled: false }
export interface FinanceRequest { id: string; version: number; state: string; created_at: string; user_id?: string; publisher_id?: string;
  requested_tokens?: number; amount_fen?: number; gross_refund_fen?: number; fee_deduction_fen?: number | null; net_refund_fen?: number | null; reason?: string; review_note?: string }
export interface Revenue { earned_units: number; reserved_units: number; available_units: number; unitDenominator: 100; payoutPolicy: { currency: 'CNY'; tokensPerCny: 10; minimumFen: 10000 }; paymentsEnabled: false }
export interface SecurityItem { item: { id: string; name: string; revision: number; security_status: string }; releases: { id: string; version: string; sha256: string; review_state: string; verdict: string | null; code: string | null }[] }
export interface SyncStatus { enabled: boolean; ready: boolean; initialized: boolean; cursor: number; lastSuccessAt: number | null; lastReconciledAt: number | null; errorCode: string | null; repairing: boolean }
const preventPreview = () => { if (isTestSession()) throw new ApiError('前端测试账户不提交商店操作', 403); };
const emptyPage = <T>(): Page<T> => ({ data: [], pagination: { limit: 50, offset: 0, total: 0 } });
export const newCommerceKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
export function cnyToFen(value: string) {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new ApiError('金额最多保留两位小数', 422);
  const fen = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
  if (fen > BigInt(Number.MAX_SAFE_INTEGER)) throw new ApiError('金额超出支持范围', 422);
  return Number(fen);
}
export const financeState = (state: string) => ({ pending: '待审核', pending_review: '待审核', approved_pending_payment: '已批准，待打款',
  approved_pending_execution: '已批准，待原路退款', rejected: '已拒绝', closed_account_deleted: '账户已注销，申请已关闭' }[state] || state);
export const refundBlockReason = (reason: string) => ({ provider_fee_unavailable: '支付平台费用尚未核验', partial_fee_allocation_unconfirmed: '部分退款手续费分摊待确认',
  insufficient_unused_tokens: '未使用充值代币不足' }[reason] || reason);
export const commerce = {
  lots: () => isTestSession() ? Promise.resolve({ data: [] as RechargeLot[] }) : request<{ data: RechargeLot[] }>('/wallet/recharges'),
  quote: (lotId: string, tokens: number) => { preventPreview(); return request<RefundQuote>('/wallet/refund-quote?' + new URLSearchParams({ lotId, tokens: String(tokens) })); },
  refunds: () => isTestSession() ? Promise.resolve(emptyPage<FinanceRequest>()) : request<Page<FinanceRequest>>('/wallet/refund-requests'),
  refund: (rechargeLotId: string, requestedTokens: number, reason: string, key: string) => { preventPreview(); return request('/wallet/refund-requests', {
    method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ rechargeLotId, requestedTokens, reason }) }); },
  revenue: () => isTestSession() ? Promise.resolve({ earned_units: 0, reserved_units: 0, available_units: 0, unitDenominator: 100,
    payoutPolicy: { currency: 'CNY', tokensPerCny: 10, minimumFen: 10000 }, paymentsEnabled: false } as Revenue) : request<Revenue>('/publisher/revenue'),
  withdrawals: () => isTestSession() ? Promise.resolve(emptyPage<FinanceRequest>()) : request<Page<FinanceRequest>>('/publisher/withdrawals'),
  withdraw: (amountFen: number, key: string) => { preventPreview(); return request('/publisher/withdrawals', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ amountFen }) }); },
  discount: (product: StoreProduct, discountedTokenPrice: number | null) => { preventPreview(); return request<StoreProduct>('/publisher/products/' + product.id + '/discount', {
    method: 'PATCH', headers: { 'If-Match': `"${product.revision}"` }, body: JSON.stringify({ discountedTokenPrice }) }); },
  adminRequests: (kind: 'withdrawals' | 'token-refunds') => { preventPreview(); return request<Page<FinanceRequest>>('/manage/store/' + kind + '?limit=100'); },
  refundDetails: (id: string) => { preventPreview(); return request<{ request: FinanceRequest; quote: RefundQuote }>('/manage/store/token-refunds/' + id); },
  review: (kind: 'withdrawals' | 'token-refunds', row: FinanceRequest, decision: 'approve' | 'reject', note: string) => { preventPreview(); return request('/manage/store/' + kind + '/' + row.id, {
    method: 'POST', headers: { 'If-Match': `"${row.version}"` }, body: JSON.stringify({ decision, note }) }); },
  syncStatus: () => { preventPreview(); return request<SyncStatus>('/manage/store/accounts/sync'); },
  sync: () => { preventPreview(); return request<{ status: string }>('/manage/store/accounts/sync', { method: 'POST', body: '{}' }); },
  security: (id: string) => { preventPreview(); return request<SecurityItem>('/manage/store/items/' + encodeURIComponent(id) + '/security'); },
  decideSecurity: (item: SecurityItem['item'], classification: 'suspected' | 'confirmed_malicious' | 'clear', sha256: string, evidence: string) => {
    preventPreview(); return request('/manage/store/items/' + item.id + '/security', { method: 'POST', headers: { 'If-Match': `"${item.revision}"` }, body: JSON.stringify({ classification, sha256, evidence }) });
  }
};
