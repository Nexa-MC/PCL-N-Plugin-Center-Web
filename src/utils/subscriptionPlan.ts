import type { BillingCycle } from '../config/pricing.ts';
export interface CurrentPlan { rank: number; billingCycle: BillingCycle | null; status: string }
export type PlanAction = 'subscribe' | 'current' | 'upgrade' | 'downgrade' | 'switch_cycle' | 'unknown';
export function confirmedPlan(value: unknown): CurrentPlan | null {
  const row = value as (Partial<CurrentPlan> & { id?: string }) | null;
  if (!row || !Number.isInteger(row.rank) || row.rank! < 0 || row.rank! > 4 || !['month', 'year', null].includes(row.billingCycle ?? null)) return null;
  if (row.id !== undefined && ['free', 'lite', 'standard', 'advanced', 'ultimate'].indexOf(row.id) !== row.rank) return null;
  if (row.rank === 0 && row.status === 'free') return { rank: 0, billingCycle: null, status: 'free' };
  if (row.rank! > 0 && ['active', 'trialing', 'canceling'].includes(row.status || '')) return { rank: row.rank!, billingCycle: row.billingCycle ?? null, status: row.status! };
  return null;
}
export function planAction(current: CurrentPlan | null, targetRank: number, cycle: BillingCycle): PlanAction {
  if (!current) return 'unknown';
  if (current.rank === 0) return 'subscribe';
  if (targetRank > current.rank) return 'upgrade';
  if (targetRank < current.rank) return 'downgrade';
  return current.billingCycle && current.billingCycle !== cycle ? 'switch_cycle' : 'current';
}
export function visiblePlanRanks(current: CurrentPlan | null, expanded: boolean): number[] {
  return [1, 2, 3, 4].filter(rank => expanded || !current || rank >= current.rank);
}
