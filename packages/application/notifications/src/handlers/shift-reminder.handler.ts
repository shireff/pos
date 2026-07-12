import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { ShiftSessionOpened, ShiftSessionClosed } from '@packages/domain-sales';

/**
 * Shift open reminder — notifies the Branch Manager when a cashier opens a shift
 * (so they can verify the float). Normal priority.
 */
export class ShiftOpenReminderHandler implements NotificationHandler<ShiftSessionOpened> {
  public readonly eventType = 'ShiftSessionOpened';

  public async handle(
    event: ShiftSessionOpened,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'BRANCH_MANAGER', branchId: event.branchId });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'SHIFT_OPENED',
        category: 'GENERAL',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.shiftOpenReminder,
        bodyKey: NOTIFICATION_KEYS.shiftOpenReminder,
        vars: { branchId: event.branchId },
        referenceType: 'ShiftSession',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

/**
 * Shift close reminder — notifies the Branch Manager when a shift is closed
 * (so they can reconcile the till). Normal priority.
 */
export class ShiftCloseReminderHandler implements NotificationHandler<ShiftSessionClosed> {
  public readonly eventType = 'ShiftSessionClosed';

  public async handle(
    event: ShiftSessionClosed,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'BRANCH_MANAGER', branchId: event.branchId });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'SHIFT_CLOSED',
        category: 'GENERAL',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.shiftCloseReminder,
        bodyKey: NOTIFICATION_KEYS.shiftCloseReminder,
        vars: { branchId: event.branchId },
        referenceType: 'ShiftSession',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
