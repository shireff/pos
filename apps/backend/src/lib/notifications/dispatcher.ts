import { t } from '../i18n';
import { eventBus } from '@packages/shared-kernel';
import type { DomainEventBase } from '@packages/shared-kernel';
import {
  NotificationDispatcher,
  getAllHandlers,
  systemClock,
} from '@packages/application-notifications';
import {
  MongoNotificationRepository,
  MongoNotificationPreferenceRepository,
  MongoRateLimitRepository,
} from '@packages/infrastructure-mongodb';
import {
  InAppNotificationChannel,
  PushNotificationChannel,
  EmailNotificationChannel,
  NoopPushProvider,
  NoopEmailProvider,
} from '@packages/infrastructure-notifications';
import { MongoRecipientResolver } from './resolver';
import { getMongoDb } from '../cloud-db';

let dispatcherInstance: NotificationDispatcher | null = null;
let started = false;

async function resolveEmail(userId: string): Promise<string | null> {
  const db = await getMongoDb();
  const doc = await db
    .collection<any>('users')
    .findOne({ _id: userId }, { projection: { email: 1 } });
  const email = (doc as Record<string, unknown> | null)?.email;
  return email ? String(email) : null;
}

/**
 * Returns the singleton Notification Dispatcher wired to the shared EventBus,
 * Mongo repositories, channel adapters, and the role-based recipient resolver.
 */
export function getNotificationDispatcher(): NotificationDispatcher {
  if (!dispatcherInstance) {
    dispatcherInstance = new NotificationDispatcher({
      handlers: getAllHandlers(systemClock),
      channels: [
        new InAppNotificationChannel(new MongoNotificationRepository()),
        new PushNotificationChannel(new NoopPushProvider()),
        new EmailNotificationChannel(new NoopEmailProvider(), resolveEmail),
      ],
      notificationRepo: new MongoNotificationRepository(),
      preferenceRepo: new MongoNotificationPreferenceRepository(),
      rateLimitRepo: new MongoRateLimitRepository(),
      resolver: new MongoRecipientResolver(),
      translator: (key, vars) => t(key, vars),
      clock: systemClock,
    });
  }
  return dispatcherInstance;
}

/** Subscribes the dispatcher to the shared EventBus (idempotent). */
export function ensureNotificationDispatcherStarted(): void {
  if (started) return;
  getNotificationDispatcher().start(eventBus);
  started = true;
}

/**
 * Publishes a Domain Event to the shared EventBus and ensures the dispatcher is
 * subscribed. Domain commands / route handlers call this after performing the
 * action that should notify (Notifications.md §1, BR-NOT-001).
 */
export async function publishDomainEvent(event: DomainEventBase): Promise<void> {
  ensureNotificationDispatcherStarted();
  await eventBus.publish(event);
}
