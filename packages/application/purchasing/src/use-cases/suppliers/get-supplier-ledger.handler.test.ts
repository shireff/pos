import { describe, it, expect, vi } from 'vitest';
import { GetSupplierLedgerQuery, type GetSupplierLedgerInput } from './index';
import { SupplierLedgerEntry } from '@packages/domain-purchasing';

describe('GetSupplierLedgerQuery', () => {
  it('returns empty result when no entries', async () => {
    const mockRepo = {
      findBySupplier: vi.fn().mockResolvedValue([]),
      countBySupplier: vi.fn().mockResolvedValue(0),
    } as any;

    const query = new GetSupplierLedgerQuery(mockRepo);
    const result = await query.execute({
      supplierId: 'supplier-1',
      companyId: 'company-1',
    });

    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.runningBalance).toBe(0);
  });

  it('returns entries with running balance', async () => {
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
        amountPiasters: -3000,
        referenceType: null,
        referenceId: null,
        notes: null,
        occurredAt: '2026-08-02T00:00:00.000Z',
      }),
    ];

    const mockRepo = {
      findBySupplier: vi.fn().mockResolvedValue(entries),
      countBySupplier: vi.fn().mockResolvedValue(2),
    } as any;

    const query = new GetSupplierLedgerQuery(mockRepo);
    const result = await query.execute({
      supplierId: 'supplier-1',
      companyId: 'company-1',
    });

    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.runningBalance).toBe(7000);
  });
});
