import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';

export interface OfflineConflictResult {
  conflictsA: number;
  conflictsB: number;
  conflictField: string | undefined;
}

/**
 * E2E Flow #5 (offline conflict): Device A and Device B both edit the same
 * product price while offline, then reconnect. A concurrent Class B conflict
 * must be detected on both devices.
 */
export async function runOfflineConflictScenario(
  harness: SyncSimulationHarness,
): Promise<OfflineConflictResult> {
  const A = 'A';
  const B = 'B';

  harness.partition(A);
  harness.partition(B);

  await harness.editClassB(A, 'products', 'p1', 'price', 100, new HybridLogicalClock(10, 0, 'A'));
  await harness.editClassB(B, 'products', 'p1', 'price', 120, new HybridLogicalClock(10, 0, 'B'));

  await harness.reconnect(A);
  await harness.reconnect(B);
  await harness.syncRound();

  const conflictsA = harness.pendingConflicts(A);
  const conflictsB = harness.pendingConflicts(B);

  return {
    conflictsA: conflictsA.length,
    conflictsB: conflictsB.length,
    conflictField: conflictsA[0]?.field,
  };
}
