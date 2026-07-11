import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';

export interface BacklogCatchupResult {
  pulled: number;
  stockOnB: number;
  expectedTotal: number;
}

/**
 * E2E Flow #6 (backlog catch-up): Device B stays offline while Device A produces
 * a large backlog of events. On reconnect, B catches up via the paginated
 * backlog source and its replica converges to the same stock total.
 */
export async function runBacklogCatchupScenario(
  harness: SyncSimulationHarness,
  eventCount = 1000,
): Promise<BacklogCatchupResult> {
  const A = 'A';
  const B = 'B';
  const productId = 'p1';

  harness.partition(B);

  let expectedTotal = 0;
  for (let i = 0; i < eventCount; i++) {
    const qty = i % 2 === 0 ? -1 : 1; // alternating sale / receipt → net 0 over a pair
    expectedTotal += qty;
    await harness.editClassA(
      A,
      productId,
      qty < 0 ? 'SALE' : 'PURCHASE_RECEIPT',
      qty,
      new HybridLogicalClock(1000 + i, 0, A),
    );
  }

  // A broadcasts to the server log (B is offline, so it buffers there).
  await harness.syncRound();

  // B reconnects and pulls the whole backlog from the server log.
  await harness.reconnect(B);
  const pulled = await harness.catchUp(B);

  return {
    pulled,
    stockOnB: harness.getDevice(B).replica.getStock(productId),
    expectedTotal,
  };
}
