import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncSimulationHarness } from '../sync-simulation-harness';

/**
 * MANDATORY multi-device simulation harness test (TESTS.md).
 *
 * E2E Flow #6 (backlog catch-up): a device stays offline for an extended period
 * (simulated 2 weeks / 1000+ events) while another device produces a large
 * backlog. On reconnect the device catches up via the paginated backlog source
 * and its replica converges to the same total. Memory and time are bounded by
 * the paginator (fixed page size), so catch-up never OOMs.
 */
describe('SyncSimulationHarness — offline-backlog', () => {
  it('catches a device up after a 1000+ event backlog (2 simulated weeks)', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const productId = 'p1';

    harness.partition('B');

    const eventCount = 1200; // > 1000 events, well beyond a 2-week backlog
    let expectedTotal = 0;
    for (let i = 0; i < eventCount; i++) {
      const qty = i % 2 === 0 ? -1 : 1; // alternating sale / receipt
      expectedTotal += qty;
      await harness.editClassA(
        'A',
        productId,
        qty < 0 ? 'SALE' : 'PURCHASE_RECEIPT',
        qty,
        new HybridLogicalClock(1000 + i, 0, 'A'),
      );
    }

    // A's events land on the server log; B is offline so it buffers there.
    await harness.syncRound();

    await harness.reconnect('B');
    const pulled = await harness.catchUp('B');

    expect(pulled).toBe(eventCount);
    expect(harness.getDevice('B').replica.getStock(productId)).toBe(expectedTotal);
    // A already has the final total applied locally.
    expect(harness.getDevice('A').replica.getStock(productId)).toBe(expectedTotal);
  });

  it('converges using pages smaller than the backlog (bounded memory)', async () => {
    const harness = new SyncSimulationHarness('company-1', ['A', 'B']);
    const productId = 'p1';
    const eventCount = 250;

    harness.partition('B');
    for (let i = 0; i < eventCount; i++) {
      await harness.editClassA('A', productId, 'SALE', -1, new HybridLogicalClock(1000 + i, 0, 'A'));
    }
    await harness.syncRound();
    await harness.reconnect('B');

    const pulled = await harness.catchUp('B');
    expect(pulled).toBe(eventCount);
    expect(harness.getDevice('B').replica.getStock(productId)).toBe(-eventCount);
  });
});
