import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';

/**
 * MANDATORY multi-device simulation harness test (TESTS.md).
 *
 * Field-level Class B merge behaviour:
 *  - Concurrent edits to the SAME field on two offline devices produce a conflict.
 *  - Concurrent edits to DIFFERENT fields are auto-applied (no conflict).
 */
describe('SyncSimulationHarness — field-merge-conflict', () => {
  it('queues a conflict when both devices edit the same field (price) offline', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);

    harness.partition('A');
    harness.partition('B');

    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 120, new HybridLogicalClock(10, 0, 'B'));

    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    expect(harness.pendingConflicts('A')).toHaveLength(1);
    expect(harness.pendingConflicts('B')).toHaveLength(1);
    expect(harness.pendingConflicts('A')[0].field).toBe('price');
  });

  it('auto-applies non-conflicting fields (price vs description) without conflict', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);

    harness.partition('A');
    harness.partition('B');

    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'description', 'on sale', new HybridLogicalClock(9, 0, 'B'));

    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(harness.pendingConflicts('B')).toHaveLength(0);

    // Both values landed on both devices.
    expect(harness.getDevice('A').replica.getFieldValue('products', 'p1', 'price')).toBe(100);
    expect(harness.getDevice('A').replica.getFieldValue('products', 'p1', 'description')).toBe('on sale');
    expect(harness.getDevice('B').replica.getFieldValue('products', 'p1', 'price')).toBe(100);
    expect(harness.getDevice('B').replica.getFieldValue('products', 'p1', 'description')).toBe('on sale');
  });

  it('auto-applies sequential (causally-ordered) same-field edits — later HLC wins', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);

    // B edits first (observed by nobody), then A edits later with a higher HLC.
    harness.partition('A');
    harness.partition('B');
    await harness.editClassB('B', 'products', 'p1', 'price', 120, new HybridLogicalClock(10, 0, 'B'));
    await harness.editClassB('A', 'products', 'p1', 'price', 150, new HybridLogicalClock(20, 0, 'A'));

    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(harness.pendingConflicts('B')).toHaveLength(0);

    // A's later HLC wins everywhere.
    expect(harness.getDevice('A').replica.getFieldValue('products', 'p1', 'price')).toBe(150);
    expect(harness.getDevice('B').replica.getFieldValue('products', 'p1', 'price')).toBe(150);
  });
});
