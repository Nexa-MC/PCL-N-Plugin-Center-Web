export interface PaymentPresentment { id: string; currency: string; amount: string; paidAt: string }
export function paymentPresentments(value: unknown): PaymentPresentment[] {
  const data = value as { payments?: PaymentPresentment[] } | null;
  if (!Array.isArray(data?.payments) || data.payments.length > 20) throw new Error('Invalid payments');
  for (const row of data.payments) {
    if (!row || typeof row.id !== 'string' || row.id.length > 160 || typeof row.currency !== 'string' || !/^[A-Z]{3}$/.test(row.currency)
      || typeof row.amount !== 'string' || !/^(0|[1-9][0-9]{0,11})(\.[0-9]{1,3})?$/.test(row.amount) || !Number.isFinite(Date.parse(row.paidAt))) throw new Error('Invalid payment');
  }
  return data.payments;
}
