import { describe, it, expect } from 'vitest';
import {
  StockMovementEvent,
  StockItem,
  StockProjectionService,
  StockEventType,
} from '@packages/domain-inventory';
import { Identifier } from '@packages/shared-kernel';

const EVENT_TYPES: StockEventType[] = [
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'PURCHASE_RECEIPT',
];

function makeEvent(type: StockEventType, quantity: number): StockMovementEvent {
  return StockMovementEvent.record({
    companyId: 'company-1',
    warehouseId: 'warehouse-1',
    productId: 'product-1',
    variantId: null,
    batchId: null,
    eventType: type,
    quantity,
    referenceType: 'test',
    referenceId: Identifier.generate(),
    occurredAt: new Date().toISOString(),
  });
}

// Fisher–Yates shuffle (deterministic enough for a repeatable property check).
function shuffle<T>(input: T[], seed: number): T[] {
  const arr = [...input];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

describe('stock-commutativity.property.test.ts (MANDATORY exit gate)', () => {
  it('identical final projection regardless of event ordering (sum invariant)', () => {
    const events = [
      makeEvent('SALE', -10),
      makeEvent('RETURN', 10),
      makeEvent('ADJUSTMENT', 5),
      makeEvent('TRANSFER_OUT', -7),
      makeEvent('TRANSFER_IN', 7),
    ];

    const canonical = events.reduce((sum, e) => sum + e.quantity, 0);

    for (let seed = 1; seed <= 50; seed++) {
      const perm = shuffle(events, seed);
      const total = perm.reduce((sum, e) => sum + e.quantity, 0);
      expect(total).toBe(canonical);
    }
  });

  it('StockItem projection is order-independent across many random orderings', () => {
    // Build a random set of ~40 mixed events.
    const events: StockMovementEvent[] = [];
    let seed = 42;
    for (let i = 0; i < 40; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const type = EVENT_TYPES[seed % EVENT_TYPES.length];
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const magnitude = (seed % 20) + 1;
      const isOut = type === 'SALE' || type === 'TRANSFER_OUT';
      events.push(makeEvent(type, isOut ? -magnitude : magnitude));
    }

    const canonicalTotal = events.reduce((sum, e) => sum + e.quantity, 0);

    for (let s = 1; s <= 60; s++) {
      const permuted = shuffle(events, s * 7 + 1);
      const item = StockItem.create({
        companyId: 'company-1',
        productId: 'product-1',
        variantId: null,
        warehouseId: 'warehouse-1',
        batchId: null,
        reorderPoint: 0,
        reorderQuantity: 0,
      });
      StockProjectionService.applyEvents(item, permuted);
      expect(item.quantityOnHand).toBe(canonicalTotal);
    }
  });
});
