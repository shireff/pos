import { describe, expect, it } from 'vitest';
import { createProductSyncEnvelope, detectPriceConflict } from './sync-product';

describe('product sync helpers', () => {
  it('creates an outbox envelope for product events', () => {
    const envelope = createProductSyncEnvelope('product-1', 'created', { name: 'Coffee' });

    expect(envelope.aggregateType).toBe('Product');
    expect(envelope.aggregateId).toBe('product-1');
    expect(envelope.eventType).toBe('created');
  });

  it('detects a price conflict', () => {
    const conflict = detectPriceConflict({ sellingPrice: 1000 }, { sellingPrice: 1200 });

    expect(conflict).toBe(true);
  });
});
