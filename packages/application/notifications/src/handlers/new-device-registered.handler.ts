import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { DeviceRegistered } from '@packages/domain-identity';

/**
 * New device registered to company (Notifications.md §3) → Normal, owner only,
 * SECURITY category, in-app + email (per trigger row, channel handled by prefs).
 */
export class NewDeviceRegisteredHandler implements NotificationHandler<DeviceRegistered> {
  public readonly eventType = 'DeviceRegistered';

  public async handle(
    event: DeviceRegistered,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'NEW_DEVICE',
        category: 'SECURITY',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.newDevice,
        bodyKey: NOTIFICATION_KEYS.newDevice,
        vars: { deviceType: event.deviceType },
        referenceType: 'Device',
        referenceId: event.deviceId,
      }),
    ];
  }
}
