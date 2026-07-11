import { describe, it, expect } from 'vitest';
import { SupplierPriceHistory } from './entities/supplier-price-history.entity';

describe('SupplierPriceHistory entity', () => {
  it('creates with generated id and timestamps', () => {
    const entry = SupplierPriceHistory.create({
      supplierId: 'supplier-1',
      companyId: 'company-1',
      productId: 'product-1',
      variantId: null,
      unitPricePiasters: 5000,
      effectiveDate: '2026-08-01T00:00:00.000Z',
      purchaseOrderId: 'PO-001',
    });

    expect(entry.id).toBeDefined();
    expect(entry.supplierId).toBe('supplier-1');
    expect(entry.productId).toBe('product-1');
    expect(entry.unitPricePiasters).toBe(5000);
    expect(entry.recordedAt).toBeDefined();
    expect(entry.createdAt).toBeDefined();
  });

  it('reconstitutes from persisted state', () => {
    const entry = SupplierPriceHistory.reconstitute({
      id: 'ph-1',
      supplierId: 'supplier-1',
      companyId: 'company-1',
      productId: 'product-1',
      variantId: 'variant-1',
      unitPricePiasters: 5500,
      effectiveDate: '2026-08-01T00:00:00.000Z',
      recordedAt: '2026-08-01T00:00:00.000Z',
      purchaseOrderId: 'PO-002',
      createdAt: '2026-08-01T00:00:00.000Z',
    });

    expect(entry.id).toBe('ph-1');
    expect(entry.variantId).toBe('variant-1');
    expect(entry.purchaseOrderId).toBe('PO-002');
  });
});
