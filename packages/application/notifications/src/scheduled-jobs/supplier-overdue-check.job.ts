import type { Clock } from '../ports';
import { systemClock } from '../ports';
import { SupplierOverduePayment } from '@packages/domain-purchasing';

export interface OverdueSupplierEntry {
  companyId: string;
  supplierId: string;
  overduePiasters: number;
  daysOverdue: number;
}

export interface SupplierOverdueCheckDeps {
  /** Returns suppliers with overdue payments for all companies. */
  findOverdueSuppliers: () => Promise<OverdueSupplierEntry[]>;
  /** Publishes a domain event to the internal EventBus. */
  publish: (event: SupplierOverduePayment) => Promise<void> | void;
  clock?: Clock;
}

/**
 * Nightly supplier-overdue check (Notifications.md §3). Scans the supplier
 * ledger and publishes a SupplierOverduePayment event for each overdue
 * supplier; the dispatcher turns it into an owner/accountant alert.
 */
export async function runSupplierOverdueCheck(
  deps: SupplierOverdueCheckDeps,
): Promise<number> {
  const clock = deps.clock ?? systemClock;
  const entries = await deps.findOverdueSuppliers();
  let published = 0;
  for (const entry of entries) {
    await deps.publish(
      new SupplierOverduePayment({
        eventId: `overdue-${entry.supplierId}-${clock.now().toISOString()}`,
        companyId: entry.companyId,
        supplierId: entry.supplierId,
        overduePiasters: entry.overduePiasters,
        daysOverdue: entry.daysOverdue,
      }),
    );
    published += 1;
  }
  return published;
}
