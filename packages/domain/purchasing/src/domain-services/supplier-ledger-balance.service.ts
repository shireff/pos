import { SupplierLedgerEntry } from '../entities/supplier-ledger-entry.entity';

export class SupplierLedgerBalanceProjection {
  public static computeBalance(entries: SupplierLedgerEntry[]): number {
    return entries.reduce((sum, entry) => sum + entry.amountPiasters, 0);
  }
}
