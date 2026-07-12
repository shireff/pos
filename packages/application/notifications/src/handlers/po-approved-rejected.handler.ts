import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { PurchaseOrderApproved, PurchaseOrderRejected } from '@packages/domain-purchasing';

export class PurchaseOrderApprovedHandler
  implements NotificationHandler<PurchaseOrderApproved>
{
  public readonly eventType = 'PurchaseOrderApproved';

  public async handle(
    event: PurchaseOrderApproved,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'PO_APPROVED',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.poApproved,
        bodyKey: NOTIFICATION_KEYS.poApproved,
        actionUrl: `/purchase-orders/${event.aggregateId}`,
        referenceType: 'PurchaseOrder',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class PurchaseOrderRejectedHandler
  implements NotificationHandler<PurchaseOrderRejected>
{
  public readonly eventType = 'PurchaseOrderRejected';

  public async handle(
    event: PurchaseOrderRejected,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'PO_REJECTED',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.poRejected,
        bodyKey: NOTIFICATION_KEYS.poRejected,
        vars: { reason: event.reason },
        referenceType: 'PurchaseOrder',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
