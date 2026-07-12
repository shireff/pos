import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { CreditLimitApproaching } from '@packages/domain-crm';

/**
 * Customer credit limit approaching (Notifications.md §3). Fires on the nightly
 * ledger check when a customer's credit balance exceeds 80% of their limit →
 * High priority alert to owner/manager.
 */
export class CreditLimitApproachingHandler
  implements NotificationHandler<CreditLimitApproaching>
{
  public readonly eventType = 'CreditLimitApproaching';

  public async handle(
    event: CreditLimitApproaching,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    const percent = Math.round((event.creditBalancePiasters / event.creditLimitPiasters) * 100);
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'CREDIT_LIMIT_APPROACHING',
        category: 'GENERAL',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.creditLimitApproaching,
        bodyKey: NOTIFICATION_KEYS.creditLimitApproaching,
        vars: { customerId: event.customerId, percent },
        referenceType: 'Customer',
        referenceId: event.customerId,
      }),
    ];
  }
}
