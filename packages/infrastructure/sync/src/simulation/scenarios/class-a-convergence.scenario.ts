import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';

export interface ClassAConvergenceResult {
  totals: Record<string, number>;
}

/**
 * Class A convergence: several devices make commutative stock edits to the same
 * product while offline, then reconnect and sync. All devices must converge to
 * the identical stock total regardless of edit/replay order.
 */
export async function runClassAConvergenceScenario(
  harness: SyncSimulationHarness,
  productId = 'p1',
): Promise<ClassAConvergenceResult> {
  const deviceIds = ['A', 'B', 'C'];

  for (const id of deviceIds) harness.partition(id);

  // Each device sells / receives different quantities offline.
  await harness.editClassA('A', productId, 'SALE', -5, new HybridLogicalClock(10, 0, 'A'));
  await harness.editClassA('A', productId, 'RETURN', 2, new HybridLogicalClock(11, 0, 'A'));
  await harness.editClassA('B', productId, 'SALE', -3, new HybridLogicalClock(10, 0, 'B'));
  await harness.editClassA('C', productId, 'PURCHASE_RECEIPT', 20, new HybridLogicalClock(12, 0, 'C'));

  for (const id of deviceIds) await harness.reconnect(id);
  // Two rounds guarantee every device has received every other device's events.
  await harness.syncRound();
  await harness.syncRound();

  const totals: Record<string, number> = {};
  for (const id of deviceIds) {
    totals[id] = harness.getDevice(id).replica.getStock(productId);
  }
  return { totals };
}
