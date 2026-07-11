import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../simulation/sync-simulation-harness';
import { ConflictResolutionService } from '@packages/application-sync';

/**
 * E2E Flow #5 (offline conflict):
 *
 *  1. Device A and Device B both edit the same product price while offline.
 *  2. Both reconnect and sync.
 *  3. A concurrent Class B conflict record is created on each device.
 *  4. The conflict is surfaced in the resolution UI (local + remote values).
 *  5. The user resolves the conflict; the resolution is recorded in the audit trail.
 *  6. Both devices converge to the same value.
 */
describe('E2E Flow #5 — offline conflict resolved in UI', () => {
  it('creates a conflict, resolves it, and converges both devices', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const deviceA = harness.getDevice('A');
    const deviceB = harness.getDevice('B');

    // Step 1: both edit the same product price offline.
    harness.partition('A');
    harness.partition('B');
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 120, new HybridLogicalClock(10, 0, 'B'));

    // Step 2: reconnect + sync.
    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    // Step 3: a conflict record exists on both devices.
    const conflictsA = harness.pendingConflicts('A');
    const conflictsB = harness.pendingConflicts('B');
    expect(conflictsA).toHaveLength(1);
    expect(conflictsB).toHaveLength(1);

    const conflictA = conflictsA[0];
    // Step 4: the UI shows both values side-by-side.
    expect(conflictA.field).toBe('price');
    expect(conflictA.localValue).toBe(100);
    expect(conflictA.remoteValue).toBe(120);

    // Step 5: the user resolves on each device via the real resolution service.
    const resolverA = new ConflictResolutionService({ conflicts: deviceA.conflicts, replica: deviceA.replica });
    const resolverB = new ConflictResolutionService({ conflicts: deviceB.conflicts, replica: deviceB.replica });

    // A adopts the remote (B's) value; B keeps its local value. Both → 120.
    const resolvedA = await resolverA.resolve(conflictA.id, 'remote', 'manager-1');
    const resolvedB = await resolverB.resolve(conflictsB[0].id, 'local', 'manager-1');

    expect(resolvedA.status).toBe('resolved_remote');
    expect(resolvedA.auditTrail).toHaveLength(1);
    expect(resolvedA.auditTrail[0].byUserId).toBe('manager-1');
    expect(resolvedB.status).toBe('resolved_local');
    expect(resolvedB.auditTrail[0].byUserId).toBe('manager-1');

    // Step 6: both devices converge.
    expect(deviceA.replica.getFieldValue('products', 'p1', 'price')).toBe(120);
    expect(deviceB.replica.getFieldValue('products', 'p1', 'price')).toBe(120);

    // Conflicts are no longer pending.
    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(harness.pendingConflicts('B')).toHaveLength(0);
  });

  it('bulk-resolves every conflict for an entity in one action', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const deviceA = harness.getDevice('A');

    harness.partition('A');
    harness.partition('B');
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'price', 120, new HybridLogicalClock(10, 0, 'B'));
    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    const resolver = new ConflictResolutionService({ conflicts: deviceA.conflicts, replica: deviceA.replica });
    const resolvedCount = await resolver.resolveAllForEntity('company-1', 'products', 'p1', 'remote', 'manager-1');

    expect(resolvedCount).toBe(1);
    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(deviceA.replica.getFieldValue('products', 'p1', 'price')).toBe(120);
  });
});
