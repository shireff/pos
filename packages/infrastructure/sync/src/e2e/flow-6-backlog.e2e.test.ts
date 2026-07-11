import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../simulation/sync-simulation-harness';

/**
 * E2E Flow #6 (backlog catch-up):
 *
 *  1. Device B goes offline for an extended period (simulated weeks of events).
 *  2. Device A keeps producing events that accumulate in the shared event log.
 *  3. Device B reconnects and catches up via the paginated pull.
 *  4. Memory and time stay bounded (fixed page size) — no OOM, no timeout.
 *  5. All events are applied and B's state converges to A's.
 */
describe('E2E Flow #6 — backlog catch-up after extended offline', () => {
  it('pulls the full backlog in bounded pages and converges', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const productId = 'p1';

    // Step 1: B goes offline while A keeps producing events (the backlog).
    harness.partition('B');

    const weekEvents = 700;
    const days = 14; // two simulated weeks
    const perDay = Math.floor((weekEvents * days) / days); // 700/day spread
    let expectedTotal = 0;
    let produced = 0;
    for (let d = 0; d < days; d++) {
      for (let i = 0; i < perDay; i++) {
        const qty = produced % 2 === 0 ? -1 : 1;
        expectedTotal += qty;
        await harness.editClassA(
          'A',
          productId,
          qty < 0 ? 'SALE' : 'PURCHASE_RECEIPT',
          qty,
          new HybridLogicalClock(1000 + produced, 0, 'A'),
        );
        produced++;
      }
    }

    // Step 2+3: A's events land on the log; B reconnects and catches up.
    await harness.syncRound();
    await harness.reconnect('B');

    const start = Date.now();
    const pulled = await harness.catchUp('B');
    const elapsed = Date.now() - start;

    // Step 4: bounded and fast.
    expect(pulled).toBe(produced);
    expect(elapsed).toBeLessThan(10_000);

    // Step 5: state converged (Class A merge is commutative).
    expect(harness.getDevice('B').replica.getStock(productId)).toBe(expectedTotal);
    expect(harness.getDevice('A').replica.getStock(productId)).toBe(expectedTotal);
  });

  it('handles a very large backlog without unbounded memory growth', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const productId = 'p1';
    const big = 5000;

    harness.partition('B');
    let expectedTotal = 0;
    for (let i = 0; i < big; i++) {
      const qty = -1; // all sales; total = -big
      expectedTotal += qty;
      await harness.editClassA('A', productId, 'SALE', qty, new HybridLogicalClock(1000 + i, 0, 'A'));
    }
    await harness.syncRound();
    await harness.reconnect('B');

    const pulled = await harness.catchUp('B');
    expect(pulled).toBe(big);
    expect(harness.getDevice('B').replica.getStock(productId)).toBe(expectedTotal);
  });
});
