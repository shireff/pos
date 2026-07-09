import { describe, it, expect } from 'vitest';
import { MongoStockItemRepository } from './index';

describe('MongoStockItemRepository (no direct quantity write)', () => {
  const repo = new MongoStockItemRepository();

  it('exposes no backdoor for directly writing quantity_on_hand', () => {
    // quantityOnHand is a projection cache and MUST only be mutated by the
    // projection worker via save() — never through a dedicated write method.
    expect((repo as unknown as Record<string, unknown>).directUpdateQuantity).toBeUndefined();
  });
});
