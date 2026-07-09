import { describe, it, expect } from 'vitest';
import { PurchaseOrder } from '../aggregates';
import { RECEIVED_STATUSES, TERMINAL_STATUSES } from '../value-objects';

function makeDraft(total: number) {
  const po = PurchaseOrder.create({
    companyId: 'company-1',
    branchId: 'branch-1',
    supplierId: 'supplier-1',
    expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
    requestedByUserId: 'user-1',
  });
  // orderedQuantity * unitPricePiasters === total for a single line
  po.addLine('product-1', null, 'unit-1', 1, total);
  return po;
}

describe('PurchaseOrder state machine', () => {
  it('starts in draft status', () => {
    const po = makeDraft(1000);
    expect(po.status).toBe('draft');
  });

  it('auto-approves when total is at/below threshold', () => {
    const po = makeDraft(1000);
    po.submit(2000);
    expect(po.status).toBe('approved');
  });

  it('requires approval when total is above threshold', () => {
    const po = makeDraft(5000);
    po.submit(2000);
    expect(po.status).toBe('pending_approval');
  });

  it('transitions pending_approval → approved on approve', () => {
    const po = makeDraft(5000);
    po.submit(2000);
    po.approve('manager-1');
    expect(po.status).toBe('approved');
    expect(po.approvedByUserId).toBe('manager-1');
  });

  it('transitions pending_approval → draft on reject', () => {
    const po = makeDraft(5000);
    po.submit(2000);
    po.reject('Insufficient justification provided.');
    expect(po.status).toBe('draft');
    expect(po.rejectedReason).toContain('justification');
  });

  it('rejects a too-short rejection reason', () => {
    const po = makeDraft(5000);
    po.submit(2000);
    expect(() => po.reject('short')).toThrow();
  });

  it('cancels from draft / pending / approved but not from received states', () => {
    const draft = makeDraft(1000);
    draft.cancel('no longer needed');
    expect(draft.status).toBe('cancelled');

    const approved = makeDraft(1000);
    approved.submit(2000);
    approved.cancel('duplicate');
    expect(approved.status).toBe('cancelled');

    const received = makeDraft(1000);
    received.submit(2000);
    received.receive([{ lineId: received.lines[0].id, quantityReceived: 1 }]);
    expect(TERMINAL_STATUSES.has(received.status)).toBe(true);
    expect(() => received.cancel('oops')).toThrow();
  });

  it('moves to fully_received when all lines fully received', () => {
    const po = makeDraft(1000);
    po.submit(2000);
    po.receive([{ lineId: po.lines[0].id, quantityReceived: 1 }]);
    expect(po.status).toBe('fully_received');
  });

  it('moves to partially_received when a line is partially received', () => {
    const po = PurchaseOrder.create({
      companyId: 'company-1',
      branchId: 'branch-1',
      supplierId: 'supplier-1',
      expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
      requestedByUserId: 'user-1',
    });
    po.addLine('product-1', null, 'unit-1', 100, 10);
    po.submit(2000);
    po.receive([{ lineId: po.lines[0].id, quantityReceived: 90 }]);
    expect(po.status).toBe('partially_received');
    expect(po.hasDiscrepancy()).toBe(true);
  });

  it('blocks receive when quantity exceeds ordered', () => {
    const po = makeDraft(1000);
    po.submit(2000);
    expect(() =>
      po.receive([{ lineId: po.lines[0].id, quantityReceived: 5 }]),
    ).toThrow();
  });

  it('cannot receive twice (received is terminal)', () => {
    const po = makeDraft(1000);
    po.submit(2000);
    po.receive([{ lineId: po.lines[0].id, quantityReceived: 1 }]);
    expect(RECEIVED_STATUSES.has(po.status)).toBe(true);
    expect(() =>
      po.receive([{ lineId: po.lines[0].id, quantityReceived: 1 }]),
    ).toThrow();
  });
});
