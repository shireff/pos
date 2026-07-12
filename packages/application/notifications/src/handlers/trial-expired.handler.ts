import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { SubscriptionTrialExpired } from '@packages/domain-billing';

/**
 * Trial expired → account locked. Critical, persistent, BILLING_TRIAL category,
 * delivered to the Owner. Never rate-limited or batched (BR-NOT-004).
 */
export class TrialExpiredHandler implements NotificationHandler<SubscriptionTrialExpired> {
  public readonly eventType = 'SubscriptionTrialExpired';

  public async handle(
    event: SubscriptionTrialExpired,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'TRIAL_EXPIRED',
        category: 'BILLING_TRIAL',
        priority: 'CRITICAL',
        titleKey: NOTIFICATION_KEYS.trialExpired,
        bodyKey: NOTIFICATION_KEYS.trialExpired,
        actionUrl: '/subscription/upgrade',
        referenceType: 'Subscription',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
