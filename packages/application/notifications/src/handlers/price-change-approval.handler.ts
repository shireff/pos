import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { PriceChangeRequested } from '@packages/domain-tax';

/**
 * Price change approval request (Notifications.md §3) → High priority approval
 * request to approver, with deep link to the price change.
 */
export class PriceChangeApprovalRequestHandler
  implements NotificationHandler<PriceChangeRequested>
{
  public readonly eventType = 'PriceChangeRequested';

  public async handle(
    event: PriceChangeRequested,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const approvers = await ctx.resolve({ kind: 'APPROVER' });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'PRICE_CHANGE_PENDING_APPROVAL',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.priceChangeApprovalRequest,
        bodyKey: NOTIFICATION_KEYS.priceChangeApprovalRequest,
        actionUrl: `/price-changes/${event.aggregateId}/approve`,
        referenceType: 'PriceChange',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
