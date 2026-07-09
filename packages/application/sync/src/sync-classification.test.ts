import { describe, it, expect } from 'vitest';
import {
  PURCHASING_SYNC_CLASSIFICATIONS,
  getSyncClass,
  isAppendOnly,
  usesFieldLevelHlc,
} from './sync-classification';

describe('purchasing sync classification', () => {
  it('classifies purchase_orders as Class B (field-level HLC merge)', () => {
    expect(getSyncClass('purchase_orders')).toBe('B');
    expect(usesFieldLevelHlc('purchase_orders')).toBe(true);
    expect(isAppendOnly('purchase_orders')).toBe(false);
  });

  it('classifies goods_receipt_lines as Class A (append-only)', () => {
    expect(getSyncClass('goods_receipt_lines')).toBe('A');
    expect(isAppendOnly('goods_receipt_lines')).toBe(true);
    expect(usesFieldLevelHlc('goods_receipt_lines')).toBe(false);
  });

  it('classifies supplier_invoices as Class B', () => {
    expect(getSyncClass('supplier_invoices')).toBe('B');
    expect(usesFieldLevelHlc('supplier_invoices')).toBe(true);
    expect(isAppendOnly('supplier_invoices')).toBe(false);
  });

  it('defaults unknown collections to Class B (safe HLC merge)', () => {
    expect(getSyncClass('some_future_collection')).toBe('B');
  });

  it('enumerates every purchasing collection exactly once', () => {
    const collections = PURCHASING_SYNC_CLASSIFICATIONS.map((c) => c.collection);
    expect(new Set(collections).size).toBe(collections.length);
  });
});
