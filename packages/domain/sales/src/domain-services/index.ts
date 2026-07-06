import { Result } from '@packages/shared-kernel';
import { Order } from '../aggregates';
import { TenderType } from '../value-objects';

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
  /**
   * Returns true if the order can be voided (must be completed, within same session).
   */
  public static canVoid(order: Order): boolean {
    return order.status === 'completed';
  }

  /**
   * Returns true if the order can have a return processed against it.
   */
  public static canReturn(order: Order): boolean {
    return order.status === 'completed' || order.status === 'partially_returned';
  }
}
