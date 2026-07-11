import { describe, it, expect } from 'vitest';
import { SupplierLedgerBalanceProjection } from './domain-services/supplier-ledger-balance.service';
import { SupplierLedgerEntry } from './entities/supplier-ledger-entry.entity';

describe('SupplierLedgerBalanceProjection', () => {
  it('returns zero for empty entries', () => {
    expect(SupplierLedgerBalanceProjection.computeBalance([])).toBe(0);
  });

  it('computes balance from mixed entries', () => {
    const entries: SupplierLedgerEntry[] = [
      SupplierLedgerEntry.create({
        supplierId: 'supplier-1',
        companyId: 'company-1',
        eventType: 'invoice',
        amountPiasters: 10000,
        referenceType: null,
        referenceId: null,
        notes: null,
        occurredAt: '2026-08-01T00:00:00.000Z',
      }),
      SupplierLedgerEntry.create({
        supplierId: 'supplier-1',
        companyId: 'company-1',
        eventType: 'payment',
        amountPiasters: -4000,
        referenceType: null,
        referenceId: null,
        notes: null,
        occurredAt: '2026-08-02T00:00:00.000Z',
      }),
      SupplierLedgerEntry.create({
        supplierId: 'supplier-1',
        companyId: 'company-1',
        eventType: 'credit_note',
        amountPiasters: -1000,
        referenceType: null,
        referenceId: null,
        notes: null,
        occurredAt: '2026-08-03T00:00:00.000Z',
      }),
    ];

    expect(SupplierLedgerBalanceProjection.computeBalance(entries)).toBe(5000);
  });
});
