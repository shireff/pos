import { describe, it, expect } from 'vitest';
import {
  Order,
  TenderType,
} from './index';
import {
  IdempotencyService,
  ExpiredBatchGuard,
  ReturnApprovalPolicy,
  VoidPolicy,
  LoyaltyReversalService,
  TenderValidator,
} from './domain-services';
import { ShiftSession } from './aggregates';

describe('Sales domain — business rules', () => {
  describe('Order.complete (split-tender validation)', () => {
    function buildLines() {
      return [
        {
          productVariantId: 'v1',
          batchId: null,
          quantity: 2,
          unitPricePiasters: 5000,
          discountAmountPiasters: 0,
          taxAmountPiasters: 0,
          costSnapshotPiasters: 3000,
        },
      ];
    }
    function buildPayments(total: number) {
      return [{ tenderType: 'cash' as TenderType, amountPiasters: total, providerReference: null }];
    }

    it('rejects when tender sum != grand total', () => {
      expect(() =>
        Order.complete({
          companyId: 'c1',
          branchId: 'b1',
          cashierId: 'k1',
          clientTxnId: 'txn-1',
          subtotalPiasters: 10000,
          discountTotalPiasters: 0,
          taxTotalPiasters: 0,
          grandTotalPiasters: 10000,
          lines: buildLines(),
          payments: buildPayments(9000),
        }),
      ).toThrow(/Tender sum/);
    });

    it('accepts when tender sum == grand total', () => {
      const order = Order.complete({
        companyId: 'c1',
        branchId: 'b1',
        cashierId: 'k1',
        clientTxnId: 'txn-2',
        subtotalPiasters: 10000,
        discountTotalPiasters: 0,
        taxTotalPiasters: 0,
        grandTotalPiasters: 10000,
        lines: buildLines(),
        payments: buildPayments(10000),
      });
      expect(order.status).toBe('completed');
      expect(order.grandTotalPiasters).toBe(10000);
    });
  });

  describe('IdempotencyService (BR-SAL-001)', () => {
    it('throws when an order with the same clientTxnId exists', () => {
      const existing = { id: 'o1', clientTxnId: 'dup' } as unknown as Order;
      expect(() => IdempotencyService.assertUnique(existing, 'dup')).toThrow(/already exists/);
    });
    it('passes when no existing order', () => {
      expect(() => IdempotencyService.assertUnique(null, 'fresh')).not.toThrow();
    });
  });

  describe('ExpiredBatchGuard (BR-INV-008)', () => {
    it('flags an expired batch', () => {
      expect(ExpiredBatchGuard.isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
      expect(ExpiredBatchGuard.isExpired(new Date(Date.now() + 100000).toISOString())).toBe(false);
      expect(ExpiredBatchGuard.isExpired(null)).toBe(false);
    });
    it('throws on expired batch', () => {
      expect(() => ExpiredBatchGuard.assertNotExpired(new Date(0).toISOString())).toThrow(/expired/);
    });
  });

  describe('ReturnApprovalPolicy (BR-SAL-005)', () => {
    it('requires approval above threshold', () => {
      expect(ReturnApprovalPolicy.requiresApproval(15000, 10000)).toBe(true);
      expect(ReturnApprovalPolicy.decide(15000, 10000)).toBe('requires_approval');
    });
    it('auto-approves at or below threshold', () => {
      expect(ReturnApprovalPolicy.requiresApproval(10000, 10000)).toBe(false);
      expect(ReturnApprovalPolicy.decide(5000, 10000)).toBe('auto_approve');
    });
  });

  describe('VoidPolicy (BR-SAL-006)', () => {
    it('allows void in the same shift session', () => {
      expect(() => VoidPolicy.assertSameSession('s1', 's1')).not.toThrow();
    });
    it('blocks void across shift sessions', () => {
      expect(() => VoidPolicy.assertSameSession('s1', 's2')).toThrow(/same shift/);
    });
  });

  describe('Order.void (same-session restriction)', () => {
    function completedOrder() {
      return Order.complete({
        companyId: 'c1',
        branchId: 'b1',
        cashierId: 'k1',
        clientTxnId: 'txn-v',
        shiftSessionId: 's1',
        subtotalPiasters: 10000,
        discountTotalPiasters: 0,
        taxTotalPiasters: 0,
        grandTotalPiasters: 10000,
        lines: [
          { productVariantId: 'v1', batchId: null, quantity: 1, unitPricePiasters: 10000, discountAmountPiasters: 0, taxAmountPiasters: 0, costSnapshotPiasters: 5000 },
        ],
        payments: [{ tenderType: 'cash', amountPiasters: 10000, providerReference: null }],
      });
    }
    it('voids when shift matches', () => {
      const o = completedOrder();
      o.void('mistake', 's1');
      expect(o.status).toBe('voided');
    });
    it('rejects void when shift differs', () => {
      const o = completedOrder();
      expect(() => o.void('mistake', 's2')).toThrow(/same shift/);
    });
  });

  describe('ShiftSession', () => {
    it('opens and closes with cash counts', () => {
      const s = ShiftSession.open({ companyId: 'c1', branchId: 'b1', cashierId: 'k1', openingCashPiasters: 5000 });
      expect(s.status).toBe('open');
      s.close(5500);
      expect(s.status).toBe('closed');
      expect(s.closingCashPiasters).toBe(5500);
    });
  });

  describe('LoyaltyReversalService (BR-SAL-007)', () => {
    it('builds a reversal command for the original sale', () => {
      const cmd = LoyaltyReversalService.buildReversalCommand({
        returnId: 'r1',
        customerId: 'cust-1',
        originalOrderId: 'o1',
        pointsToReverse: 40,
      });
      expect(cmd.returnId).toBe('r1');
      expect(cmd.customerId).toBe('cust-1');
      expect(cmd.originalOrderId).toBe('o1');
      expect(cmd.pointsToReverse).toBe(40);
    });
  });
});
