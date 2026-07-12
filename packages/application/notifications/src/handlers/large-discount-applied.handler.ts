import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { LargeDiscountApplied } from '@packages/domain-sales';

/**
 * Large discount applied (Notifications.md §3). Fires when a sale applies a
 * discount above the company's configured threshold → High priority approval
 * request to the approver (Audit.md / approval pattern).
 */
export class LargeDiscountAppliedHandler implements NotificationHandler<LargeDiscountApplied> {
  public readonly eventType = 'LargeDiscountApplied';

  public async handle(
    event: LargeDiscountApplied,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const approvers = await ctx.resolve({ kind: 'APPROVER', branchId: event.branchId });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'LARGE_DISCOUNT',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.largeDiscount,
        bodyKey: NOTIFICATION_KEYS.largeDiscount,
        vars: { discount: event.discountPiasters, orderId: event.orderId },
        actionUrl: `/orders/${event.orderId}`,
        referenceType: 'Order',
        referenceId: event.orderId,
      }),
    ];
  }
}
