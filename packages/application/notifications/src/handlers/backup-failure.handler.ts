import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { BackupFailed } from '@packages/domain-audit';

/**
 * Backup failure (Notifications.md §3) → Critical, owner only, SECURITY category.
 * Never rate-limited or batched (safety-relevant).
 */
export class BackupFailureHandler implements NotificationHandler<BackupFailed> {
  public readonly eventType = 'BackupFailed';

  public async handle(
    event: BackupFailed,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'BACKUP_FAILED',
        category: 'SECURITY',
        priority: 'CRITICAL',
        titleKey: NOTIFICATION_KEYS.backupFailure,
        bodyKey: NOTIFICATION_KEYS.backupFailure,
        vars: { reason: event.reason },
      }),
    ];
  }
}
