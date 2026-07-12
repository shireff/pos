import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { ReturnApproved, ReturnRejected } from '@packages/domain-sales';

export class ReturnApprovedHandler implements NotificationHandler<ReturnApproved> {
  public readonly eventType = 'ReturnApproved';

  public async handle(
    event: ReturnApproved,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'RETURN_APPROVED',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.returnApproved,
        bodyKey: NOTIFICATION_KEYS.returnApproved,
        vars: { amount: event.refundAmountPiasters },
        referenceType: 'Return',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class ReturnRejectedHandler implements NotificationHandler<ReturnRejected> {
  public readonly eventType = 'ReturnRejected';

  public async handle(
    event: ReturnRejected,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'RETURN_REJECTED',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.returnRejected,
        bodyKey: NOTIFICATION_KEYS.returnRejected,
        referenceType: 'Return',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
