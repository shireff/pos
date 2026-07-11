import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from './sync-simulation-harness';
import { runOfflineConflictScenario } from './scenarios/offline-conflict.scenario';
import { runBacklogCatchupScenario } from './scenarios/backlog-catchup.scenario';
import { runClassAConvergenceScenario } from './scenarios/class-a-convergence.scenario';

describe('SyncSimulationHarness — offline conflict (Flow #5)', () => {
  it('detects a concurrent Class B conflict on both devices and converges after resolution', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const result = await runOfflineConflictScenario(harness);

    expect(result.conflictsA).toBe(1);
    expect(result.conflictsB).toBe(1);
    expect(result.conflictField).toBe('price');

    // Resolution is device-relative: A adopts B's value (remote), B keeps its
    // own (local). Both converge to 120.
    const conflictA = harness.pendingConflicts('A')[0];
    const conflictB = harness.pendingConflicts('B')[0];
    await harness.resolveConflict('A', conflictA.id, 'remote');
    await harness.resolveConflict('B', conflictB.id, 'local');

    expect(harness.getDevice('A').replica.getFieldValue('products', 'p1', 'price')).toBe(120);
    expect(harness.getDevice('B').replica.getFieldValue('products', 'p1', 'price')).toBe(120);
  });

  it('auto-applies non-conflicting fields without a conflict', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    harness.partition('A');
    harness.partition('B');
    await harness.editClassB('A', 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
    await harness.editClassB('B', 'products', 'p1', 'description', 'sale', new HybridLogicalClock(9, 0, 'B'));
    await harness.reconnect('A');
    await harness.reconnect('B');
    await harness.syncRound();

    expect(harness.pendingConflicts('A')).toHaveLength(0);
    expect(harness.pendingConflicts('B')).toHaveLength(0);
  });
});

describe('SyncSimulationHarness — backlog catch-up (Flow #6)', () => {
  it('catches a device up after a large offline backlog and converges', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const result = await runBacklogCatchupScenario(harness, 1000);

    expect(result.pulled).toBe(1000);
    expect(result.stockOnB).toBe(result.expectedTotal);
  });
});

describe('SyncSimulationHarness — Class A convergence', () => {
  it('converges all devices to identical stock totals (order-independent)', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B', 'C']);
    const { totals } = await runClassAConvergenceScenario(harness);

    // -5 + 2 (A) + -3 (B) + 20 (C) = 14 on every device
    expect(totals['A']).toBe(14);
    expect(totals['B']).toBe(14);
    expect(totals['C']).toBe(14);
  });
});
