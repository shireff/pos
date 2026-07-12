import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { LoyaltyTierUpgraded } from '@packages/domain-crm';

/**
 * Loyalty tier upgrade (Notifications.md §3) → Low priority, batched into the
 * daily digest, owner-facing congratulatory note.
 */
export class LoyaltyTierUpgradeHandler implements NotificationHandler<LoyaltyTierUpgraded> {
  public readonly eventType = 'LoyaltyTierUpgraded';

  public async handle(
    event: LoyaltyTierUpgraded,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'LOYALTY_TIER_UPGRADE',
        category: 'GENERAL',
        priority: 'LOW',
        titleKey: NOTIFICATION_KEYS.loyaltyTierUpgrade,
        bodyKey: NOTIFICATION_KEYS.loyaltyTierUpgrade,
        vars: { customerId: event.customerId, tier: event.newTier },
        referenceType: 'Customer',
        referenceId: event.customerId,
      }),
    ];
  }
}
