import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { PurchaseOrderSubmitted } from '@packages/domain-purchasing';

/**
 * Purchase order pending approval (Notifications.md §3). Fires on
 * PurchaseOrderSubmitted when the PO is NOT auto-approved. High priority
 * approval request to the branch approver, with a deep link to the PO.
 */
export class PurchaseOrderApprovalRequestHandler
  implements NotificationHandler<PurchaseOrderSubmitted>
{
  public readonly eventType = 'PurchaseOrderSubmitted';

  public async handle(
    event: PurchaseOrderSubmitted,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    if (event.autoApproved) return [];
    const approvers = await ctx.resolve({ kind: 'APPROVER' });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'PO_PENDING_APPROVAL',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.poApprovalRequest,
        bodyKey: NOTIFICATION_KEYS.poApprovalRequest,
        actionUrl: `/purchase-orders/${event.aggregateId}/approve`,
        referenceType: 'PurchaseOrder',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
