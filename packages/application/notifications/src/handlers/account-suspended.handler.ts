import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import {
  PlatformAdminAccountSuspended,
  PlatformAdminAccountReactivated,
  PlatformAdminPlanChanged,
} from '@packages/domain-platform-admin';

/**
 * Account suspended by Platform Admin → Critical, owner only. Never reveals
 * which admin or why (Notifications.md §3, §10).
 */
export class AccountSuspendedHandler implements NotificationHandler<PlatformAdminAccountSuspended> {
  public readonly eventType = 'PlatformAdminAccountSuspended';

  public async handle(
    event: PlatformAdminAccountSuspended,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.targetCompanyId,
        recipientUserIds: recipients,
        triggerCode: 'ACCOUNT_SUSPENDED',
        category: 'SECURITY',
        priority: 'CRITICAL',
        titleKey: NOTIFICATION_KEYS.accountSuspended,
        bodyKey: NOTIFICATION_KEYS.accountSuspended,
      }),
    ];
  }
}

export class AccountReactivatedHandler
  implements NotificationHandler<PlatformAdminAccountReactivated>
{
  public readonly eventType = 'PlatformAdminAccountReactivated';

  public async handle(
    event: PlatformAdminAccountReactivated,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.targetCompanyId,
        recipientUserIds: recipients,
        triggerCode: 'ACCOUNT_REACTIVATED',
        category: 'SECURITY',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.accountReactivated,
        bodyKey: NOTIFICATION_KEYS.accountReactivated,
      }),
    ];
  }
}

export class PlanChangedHandler implements NotificationHandler<PlatformAdminPlanChanged> {
  public readonly eventType = 'PlatformAdminPlanChanged';

  public async handle(
    event: PlatformAdminPlanChanged,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.targetCompanyId,
        recipientUserIds: recipients,
        triggerCode: 'PLAN_CHANGED',
        category: 'BILLING_TRIAL',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.planChanged,
        bodyKey: NOTIFICATION_KEYS.planChanged,
        vars: { plan: event.newPlanId },
      }),
    ];
  }
}
