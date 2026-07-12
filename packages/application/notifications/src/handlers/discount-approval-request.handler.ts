import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { DiscountApprovalRequested } from '@packages/domain-promotions';

/**
 * Discount approval request (Notifications.md §3) → High priority approval
 * request to approver, with deep link to the discount rule.
 */
export class DiscountApprovalRequestHandler
  implements NotificationHandler<DiscountApprovalRequested>
{
  public readonly eventType = 'DiscountApprovalRequested';

  public async handle(
    event: DiscountApprovalRequested,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const approvers = await ctx.resolve({ kind: 'APPROVER' });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'DISCOUNT_PENDING_APPROVAL',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.discountApprovalRequest,
        bodyKey: NOTIFICATION_KEYS.discountApprovalRequest,
        actionUrl: `/discounts/${event.discountId}/approve`,
        referenceType: 'Discount',
        referenceId: event.discountId,
      }),
    ];
  }
}
