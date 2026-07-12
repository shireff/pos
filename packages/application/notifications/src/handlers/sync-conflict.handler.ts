import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { SyncConflictDetected } from '@packages/domain-sync';

/**
 * Sync conflict requires manual resolution (Notifications.md §3, TESTS.md
 * dispatcher.test). High priority to owner / assigned admin, SECURITY category
 * (safety-relevant — never suppressed), with deep link to the conflict.
 */
export class SyncConflictHandler implements NotificationHandler<SyncConflictDetected> {
  public readonly eventType = 'SyncConflictDetected';

  public async handle(
    event: SyncConflictDetected,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const owners = await ctx.resolve({ kind: 'OWNER' });
    const managers = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    const recipientUserIds = Array.from(new Set([...owners, ...managers]));
    if (recipientUserIds.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds,
        triggerCode: 'SYNC_CONFLICT',
        category: 'SECURITY',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.syncConflict,
        bodyKey: NOTIFICATION_KEYS.syncConflict,
        vars: { entityType: event.entityType },
        actionUrl: `/sync/conflicts/${event.aggregateId}`,
        referenceType: 'SyncConflict',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
