import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { ClassAMergeService } from './class-a-merge.service';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

describe('ClassAMergeService', () => {
  it('sums signed quantities regardless of order', () => {
    const events = [
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'SALE', signedQuantity: -5 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'RETURN', signedQuantity: 2 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'TRANSFER_OUT', signedQuantity: -3 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'ADJUSTMENT', signedQuantity: 10 }),
    ];

    const result = ClassAMergeService.apply(events);
    expect(result.totals.get('p1')).toBe(4);
    expect(ClassAMergeService.totalForEntity(events, 'p1')).toBe(4);
  });

  it('is order-independent (permutations yield identical projection)', () => {
    const base = [
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'SALE', signedQuantity: -5 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'RETURN', signedQuantity: 2 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'PURCHASE_RECEIPT', signedQuantity: 20 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'TRANSFER_IN', signedQuantity: 7 }),
    ];

    const permutations = [
      base,
      [...base].reverse(),
      [base[2], base[0], base[3], base[1]],
      [base[3], base[2], base[1], base[0]],
    ];

    for (const perm of permutations) {
      expect(ClassAMergeService.apply(perm).totals.get('p1')).toBe(24);
    }
  });

  it('is idempotent on eventId (replay is a no-op)', () => {
    const e1 = ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'SALE', signedQuantity: -5 });
    const first = ClassAMergeService.apply([e1]);
    const second = ClassAMergeService.apply([e1], first);
    expect(second.totals.get('p1')).toBe(-5);
    expect(second.appended.length).toBe(1);
  });

  it('keeps append-only events without merging numerically', () => {
    const audit = ClassAMergeService.makeEvent({
      entityId: 'p1',
      eventType: 'SALE',
      signedQuantity: 0,
      appendOnly: true,
    });
    const result = ClassAMergeService.apply([audit]);
    expect(result.totals.has('p1')).toBe(false);
    expect(result.appended).toContain(audit);
  });

  it('produces no conflicts (Class A is conflict-free by construction)', () => {
    const events = [
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'SALE', signedQuantity: -5 }),
      ClassAMergeService.makeEvent({ entityId: 'p1', eventType: 'SALE', signedQuantity: -3 }),
    ];
    const result = ClassAMergeService.apply(events);
    expect(result.totals.get('p1')).toBe(-8);
  });
});
