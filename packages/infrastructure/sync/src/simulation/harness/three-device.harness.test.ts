import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';
import { ConflictResolutionService } from '@packages/application-sync';

/**
 * MANDATORY multi-device simulation harness test (TESTS.md).
 *
 * Three devices each make Class B edits while offline, then reconnect in
 * DIFFERENT orders. Final state must be consistent across all three.
 */
describe('SyncSimulationHarness — three-device', () => {
  it('converges when the three devices reconnect in different orders (LWW)', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B', 'C']);

    for (const id of ['A', 'B', 'C']) harness.partition(id);

    // Ordered HLCs so the latest always wins (no conflict): C is newest.
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 200, new HybridLogicalClock(20, 0, 'B'));
    await harness.editClassB('C', 'products', 'p1', 'price', 300, new HybridLogicalClock(30, 0, 'C'));

    // Scrambled reconnect order: C, then A, then B.
    await harness.reconnect('C');
    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();
    await harness.syncRound();

    for (const id of ['A', 'B', 'C']) {
      expect(harness.getDevice(id).replica.getFieldValue('products', 'p1', 'price')).toBe(300);
      expect(harness.pendingConflicts(id)).toHaveLength(0);
    }
  });

  it('detects the same number of concurrent conflicts on every device', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B', 'C']);

    for (const id of ['A', 'B', 'C']) harness.partition(id);

    // Concurrent (equal HLC) same-field edits → conflicts on every device.
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 200, new HybridLogicalClock(10, 0, 'B'));
    await harness.editClassB('C', 'products', 'p1', 'price', 300, new HybridLogicalClock(10, 0, 'C'));

    await harness.reconnect('A');
    await harness.reconnect('C');
    await harness.reconnect('B');
    await harness.syncRound();
    await harness.syncRound();

    const counts = ['A', 'B', 'C'].map((id) => harness.pendingConflicts(id).length);
    // Each device saw the other two concurrent edits → 2 conflicts each.
    expect(counts).toEqual([2, 2, 2]);
  });

  it('resolves three-way concurrent conflicts to a single converged value', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B', 'C']);

    for (const id of ['A', 'B', 'C']) harness.partition(id);
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 200, new HybridLogicalClock(10, 0, 'B'));
    await harness.editClassB('C', 'products', 'p1', 'price', 300, new HybridLogicalClock(10, 0, 'C'));

    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.reconnect('C');
    await harness.syncRound();

    // The manager picks the highest value (300) for every conflict on every
    // device — a unified "merge" resolution that converges all three.
    for (const id of ['A', 'B', 'C']) {
      const resolver = new ConflictResolutionService({
        conflicts: harness.getDevice(id).conflicts,
        replica: harness.getDevice(id).replica,
      });
      for (const conflict of harness.pendingConflicts(id)) {
        await resolver.resolve(conflict.id, 'merge', 'manager-1', 300);
      }
    }

    for (const id of ['A', 'B', 'C']) {
      expect(harness.getDevice(id).replica.getFieldValue('products', 'p1', 'price')).toBe(300);
      expect(harness.pendingConflicts(id)).toHaveLength(0);
    }
  });
});
