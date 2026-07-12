import type { NotificationChannelPort, ChannelSendInput } from '@packages/application-notifications';
import type { NotificationRepositoryPort } from '@packages/application-notifications';
import type { RealtimeSignalerPort } from './providers';
import { NoopRealtimeSignaler } from './providers';

/**
 * In-app channel — writes the notification document to MongoDB (the source of
 * truth for every notification, Notifications.md §2/§7) and signals the
 * connected client via the realtime layer (Supabase Realtime / sync engine).
 *
 * A channel delivery failure never removes the in-app record (TESTS.md
 * channels.integration.test): persistence is committed before any external
 * signal is attempted, and a signal failure is swallowed.
 */
export class InAppNotificationChannel implements NotificationChannelPort {
  public readonly channel = 'IN_APP' as const;

  constructor(
    private readonly notificationRepo: NotificationRepositoryPort,
    private readonly signaler: RealtimeSignalerPort = new NoopRealtimeSignaler(),
  ) {}

  public isAvailable(): boolean {
    return true;
  }

  public async send(input: ChannelSendInput): Promise<void> {
    // Persist first — the in-app record must exist regardless of downstream delivery.
    await this.notificationRepo.save(input.notification);
    try {
      await this.signaler.signal(input.recipientUserId, input.notification.id);
    } catch {
      // realtime signal failures must not affect the persisted record
    }
  }
}
