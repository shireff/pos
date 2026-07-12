import { describe, it, expect } from 'vitest';
import {
  InAppNotificationChannel,
  EmailNotificationChannel,
  PushNotificationChannel,
} from '@packages/infrastructure-notifications';
import type {
  EmailProviderPort,
  EmailMessage,
  RealtimeSignalerPort,
  PushProviderPort,
  PushMessage,
} from '../providers';
import type { NotificationRepositoryPort } from '@packages/application-notifications';
import { Notification } from '@packages/domain-notifications';

class RecordingNotificationRepo implements NotificationRepositoryPort {
  public readonly saved: Notification[] = [];
  async save(n: Notification): Promise<void> {
    this.saved.push(n);
  }
  async findById(): Promise<Notification | null> {
    return null;
  }
  async findByQuery(): Promise<Notification[]> {
    return [];
  }
  async countUnread(): Promise<number> {
    return 0;
  }
  async markRead(): Promise<void> {}
  async markAllRead(): Promise<void> {}
  async findPendingDigest(): Promise<Notification[]> {
    return [];
  }
  async findPendingDigestRecipients(): Promise<Array<{ companyId: string; recipientUserId: string }>> {
    return [];
  }
  async markDigested(): Promise<void> {}
}

function makeNotification(): Notification {
  return Notification.create({
    companyId: 'company-1',
    recipientUserId: 'user-1',
    triggerCode: 'LOW_STOCK',
    category: 'INVENTORY',
    priority: 'HIGH',
    titleKey: 'notifications.lowStock',
    bodyKey: 'notifications.lowStock',
    title: 'Low stock',
    body: 'Product is below reorder point',
    vars: { productId: 'prod-1' },
  });
}

describe('channels integration', () => {
  describe('InAppNotificationChannel', () => {
    it('creates the notification row in the notifications store', async () => {
      const repo = new RecordingNotificationRepo();
      const channel = new InAppNotificationChannel(repo);
      const notification = makeNotification();
      await channel.send({ notification, recipientUserId: 'user-1', channel: 'IN_APP' });

      expect(repo.saved.length).toBe(1);
      expect(repo.saved[0].id).toBe(notification.id);
    });

    it('keeps the in-app record when the realtime signal fails (TESTS.md)', async () => {
      const repo = new RecordingNotificationRepo();
      const throwingSignaler: RealtimeSignalerPort = {
        signal: () => {
          throw new Error('realtime down');
        },
      };
      const channel = new InAppNotificationChannel(repo, throwingSignaler);
      const notification = makeNotification();
      // Must not throw.
      await expect(
        channel.send({ notification, recipientUserId: 'user-1', channel: 'IN_APP' }),
      ).resolves.toBeUndefined();
      // Record still exists despite delivery failure.
      expect(repo.saved.length).toBe(1);
    });
  });

  describe('EmailNotificationChannel', () => {
    it('sends an email with the correct subject, body and unsubscribe link', async () => {
      const sent: EmailMessage[] = [];
      const provider: EmailProviderPort = {
        send: async (m) => {
          sent.push(m);
        },
      };
      const resolveEmail = async () => 'owner@example.com';
      const channel = new EmailNotificationChannel(provider, resolveEmail, 'https://app/unsub');
      const notification = makeNotification();
      await channel.send({ notification, recipientUserId: 'user-1', channel: 'EMAIL' });

      expect(sent.length).toBe(1);
      expect(sent[0].to).toBe('owner@example.com');
      expect(sent[0].subject).toBe('Low stock');
      expect(sent[0].body).toBe('Product is below reorder point');
      expect(sent[0].unsubscribeUrl).toContain('user-1');
    });

    it('skips sending when no email address is resolvable', async () => {
      const sent: EmailMessage[] = [];
      const provider: EmailProviderPort = { send: async (m) => void sent.push(m) };
      const resolveEmail = async () => null;
      const channel = new EmailNotificationChannel(provider, resolveEmail);
      await channel.send({ notification: makeNotification(), recipientUserId: 'user-1', channel: 'EMAIL' });
      expect(sent.length).toBe(0);
    });

    it('is unavailable when no resolver is configured', async () => {
      const channel = new EmailNotificationChannel();
      expect(await channel.isAvailable('user-1')).toBe(false);
    });
  });

  describe('PushNotificationChannel', () => {
    it('calls the push provider with the correct payload when a token exists', async () => {
      const messages: Array<{ userId: string; message: PushMessage }> = [];
      const provider: PushProviderPort = {
        hasToken: (userId) => userId === 'user-1',
        send: async (userId, message) => {
          messages.push({ userId, message });
        },
      };
      const channel = new PushNotificationChannel(provider);
      const notification = makeNotification();
      expect(await channel.isAvailable('user-1')).toBe(true);
      expect(await channel.isAvailable('user-2')).toBe(false);

      await channel.send({ notification, recipientUserId: 'user-1', channel: 'PUSH' });
      expect(messages.length).toBe(1);
      expect(messages[0].message.title).toBe('Low stock');
      expect(messages[0].message.body).toBe('Product is below reorder point');
      expect(messages[0].message.actionUrl).toBeNull();
    });
  });
});
