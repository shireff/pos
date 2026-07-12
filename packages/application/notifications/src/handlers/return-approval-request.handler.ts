import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { ReturnRequested } from '@packages/domain-sales';

/**
 * Return pending approval (Notifications.md §3, §6). Fires on ReturnRequested
 * above the refund threshold → High priority approval request to the approver,
 * with a deep link. This fires atomically with the requester's
 * "Submitted — pending approval" state (BR-NOT-005).
 */
export class ReturnApprovalRequestHandler implements NotificationHandler<ReturnRequested> {
  public readonly eventType = 'ReturnRequested';

  public async handle(
    event: ReturnRequested,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    if (event.status !== 'pending_approval') return [];
    const approvers = await ctx.resolve({ kind: 'APPROVER' });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'RETURN_PENDING_APPROVAL',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.returnApprovalRequest,
        bodyKey: NOTIFICATION_KEYS.returnApprovalRequest,
        vars: { amount: event.refundAmountPiasters },
        actionUrl: `/orders/${event.originalOrderId}/returns/${event.aggregateId}/approve`,
        referenceType: 'Return',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
