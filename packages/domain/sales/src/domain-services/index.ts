import { Result } from '@packages/shared-kernel';
import { Order } from '../aggregates';
import { TenderType } from '../value-objects';
import { ReverseLoyaltyPointsCommand } from '../domain-events';

/**
 * TenderValidator ensures split-payment amounts sum to the order's grand total.
 * This is enforced at domain layer (BR-SAL-003) — not just UI validation.
 */
export class TenderValidator {
  public static validate(
    tenders: Array<{ tenderType: TenderType; amountPiasters: number }>,
    grandTotalPiasters: number,
  ): Result<void, string> {
    const sum = tenders.reduce((acc, t) => acc + t.amountPiasters, 0);
    if (sum !== grandTotalPiasters) {
      return Result.fail(
        `Tender sum (${sum} piasters) must equal grand total (${grandTotalPiasters} piasters)`,
      );
    }
    return Result.ok(undefined);
  }
}

/**
 * OrderStatusService determines status transitions for an Order aggregate.
 */
export class OrderStatusService {
  /** Returns true if the order can be voided (completed, same session). */
  public static canVoid(order: Order, currentShiftSessionId: string | null): boolean {
    return order.status === 'completed' && order.shiftSessionId === currentShiftSessionId;
  }

  /** Returns true if a return can be processed against the order. */
  public static canReturn(order: Order): boolean {
    return order.status === 'completed' || order.status === 'partially_returned';
  }
}

/**
 * IdempotencyService guards against duplicate sales submission. If an order
 * already exists for the same (companyId, clientTxnId) pair, the existing
 * order must be returned instead of creating a duplicate (BR-SAL-001).
 */
export class IdempotencyService {
  public static assertUnique(existing: Order | null, clientTxnId: string): void {
    if (existing) {
      throw new Error(
        `An order with clientTxnId "${clientTxnId}" already exists (id: ${existing.id}). Duplicate submission rejected.`,
      );
    }
  }

  /** Returns true when the provided order is the existing idempotent match. */
  public static isDuplicate(existing: Order | null): existing is Order {
    return existing !== null;
  }
}

/**
 * ExpiredBatchGuard prevents sale completion when any line references a batch
 * that has already expired (BR-INV-008). Expiry is compared in UTC.
 */
export class ExpiredBatchGuard {
  public static isExpired(expiryDate: string | null | undefined, now: Date = new Date()): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() <= now.getTime();
  }

  public static assertNotExpired(expiryDate: string | null | undefined, now: Date = new Date()): void {
    if (ExpiredBatchGuard.isExpired(expiryDate, now)) {
      throw new Error(`Cannot sell from an expired batch (BR-INV-008). expiry=${expiryDate}`);
    }
  }
}

/**
 * ReturnApprovalPolicy decides whether a return requires manager approval or can
 * be auto-approved, based on the company-configured refund threshold (BR-SAL-005).
 */
export class ReturnApprovalPolicy {
  public static requiresApproval(
    refundTotalPiasters: number,
    thresholdPiasters: number,
  ): boolean {
    return refundTotalPiasters > thresholdPiasters;
  }

  public static decide(
    refundTotalPiasters: number,
    thresholdPiasters: number,
  ): 'auto_approve' | 'requires_approval' {
    return ReturnApprovalPolicy.requiresApproval(refundTotalPiasters, thresholdPiasters)
      ? 'requires_approval'
      : 'auto_approve';
  }
}

/**
 * VoidPolicy enforces the same-shift-session restriction for voiding (BR-SAL-006).
 */
export class VoidPolicy {
  public static assertSameSession(
    orderShiftSessionId: string | null,
    currentShiftSessionId: string | null,
  ): void {
    if (orderShiftSessionId !== currentShiftSessionId) {
      throw new Error(
        'Void is only permitted during the same shift session that created the order (BR-SAL-006)',
      );
    }
  }
}

/**
 * LoyaltyReversalService produces the command that reverses loyalty points
 * earned on the original sale when a return is approved (BR-SAL-007).
 */
export class LoyaltyReversalService {
  public static buildReversalCommand(params: {
    returnId: string;
    customerId: string | null;
    originalOrderId: string;
    pointsToReverse: number;
  }): ReverseLoyaltyPointsCommand {
    return new ReverseLoyaltyPointsCommand({
      returnId: params.returnId,
      customerId: params.customerId,
      originalOrderId: params.originalOrderId,
      pointsToReverse: params.pointsToReverse,
    });
  }
}
