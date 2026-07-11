import { describe, it, expect } from 'vitest';
import { SupplierLedgerEntry } from './entities/supplier-ledger-entry.entity';

describe('SupplierLedgerEntry entity', () => {
  it('creates with generated id and timestamps', () => {
    const entry = SupplierLedgerEntry.create({
      supplierId: 'supplier-1',
      companyId: 'company-1',
      eventType: 'payment',
      amountPiasters: -5000,
      referenceType: 'Payment',
      referenceId: 'PAY-001',
      notes: 'Cash payment',
      occurredAt: '2026-08-01T00:00:00.000Z',
    });

    expect(entry.id).toBeDefined();
    expect(entry.supplierId).toBe('supplier-1');
    expect(entry.eventType).toBe('payment');
    expect(entry.amountPiasters).toBe(-5000);
    expect(entry.createdAt).toBeDefined();
  });

  it('reconstitutes from persisted state', () => {
    const entry = SupplierLedgerEntry.reconstitute({
      id: 'entry-1',
      supplierId: 'supplier-1',
      companyId: 'company-1',
      eventType: 'invoice',
      amountPiasters: 10000,
      referenceType: 'PurchaseOrder',
      referenceId: 'PO-001',
      notes: 'Invoice for August',
      occurredAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
    });

    expect(entry.id).toBe('entry-1');
    expect(entry.amountPiasters).toBe(10000);
    expect(entry.eventType).toBe('invoice');
  });
});
