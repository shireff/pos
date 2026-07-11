import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';
import type { ClassAEvent } from '@packages/domain-sync';

/** Seed shared starting stock directly on a device's replica (no outbox entry). */
function seedStock(harness: SyncSimulationHarness, deviceId: string, productId: string, qty: number): void {
  harness.getDevice(deviceId).replica.applyClassA([
    { eventId: `seed-${deviceId}`, entityId: productId, eventType: 'PURCHASE_RECEIPT', signedQuantity: qty },
  ] as ClassAEvent[]);
}

/**
 * MANDATORY multi-device simulation harness test (TESTS.md).
 *
 * Class A (commutative) inventory merge: two devices each sell stock while
 * offline; on reconnect both SALE events are applied and the stock projection
 * is the sum — never a conflict.
 */
describe('SyncSimulationHarness — inventory-concurrent', () => {
  it('applies both SALE events; stock = starting - 8 after reconnect', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const productId = 'p1';
    const starting = 100;

    // Seed identical starting stock on both devices (shared, not synced).
    seedStock(harness, 'A', productId, starting);
    seedStock(harness, 'B', productId, starting);

    harness.partition('A');
    harness.partition('B');

    // A sells 5, B sells 3 — concurrently offline.
    await harness.editClassA('A', productId, 'SALE', -5, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassA('B', productId, 'SALE', -3, new HybridLogicalClock(10, 0, 'B'));

    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(harness.pendingConflicts('B')).toHaveLength(0);

    // Class A merge is commutative: -5 + -3 = -8 regardless of replay order.
    expect(harness.getDevice('A').replica.getStock(productId)).toBe(starting - 8);
    expect(harness.getDevice('B').replica.getStock(productId)).toBe(starting - 8);
  });

  it('converges even when SALE events are delivered in a different order', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B', 'C']);
    const productId = 'p1';
    const starting = 50;

    for (const id of ['A', 'B', 'C']) {
      seedStock(harness, id, productId, starting);
    }

    for (const id of ['A', 'B', 'C']) harness.partition(id);
    await harness.editClassA('A', productId, 'SALE', -5, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassA('B', productId, 'SALE', -3, new HybridLogicalClock(11, 0, 'B'));
    await harness.editClassA('C', productId, 'SALE', -2, new HybridLogicalClock(12, 0, 'C'));

    // Reconnect in a scrambled order with a single sync round.
    await harness.reconnect('C');
    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    const expected = starting - 5 - 3 - 2;
    for (const id of ['A', 'B', 'C']) {
      expect(harness.getDevice(id).replica.getStock(productId)).toBe(expected);
    }
  });
});
