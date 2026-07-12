import type { NotificationChannelPort, ChannelSendInput } from '@packages/application-notifications';
import type { PushProviderPort } from './providers';
import { NoopPushProvider } from './providers';

/**
 * Push channel — Android (Capacitor push plugin) and Desktop (Tauri system
 * tray). Falls back gracefully when no push token / permission is available.
 */
export class PushNotificationChannel implements NotificationChannelPort {
  public readonly channel = 'PUSH' as const;

  constructor(private readonly provider: PushProviderPort = new NoopPushProvider()) {}

  public isAvailable(recipientUserId: string): boolean | Promise<boolean> {
    return this.provider.hasToken(recipientUserId);
  }

  public async send(input: ChannelSendInput): Promise<void> {
    await this.provider.send(input.recipientUserId, {
      title: input.notification.title,
      body: input.notification.body,
      actionUrl: input.notification.actionUrl,
    });
  }
}
