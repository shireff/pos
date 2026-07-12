import { describe, it, expect } from 'vitest';
import { NotificationPreference } from '@packages/domain-notifications';
import {
  isChannelMutable,
  NotificationDispatcher,
  LowStockAlertHandler,
} from '@packages/application-notifications';
import type { DomainEventBase } from '@packages/shared-kernel';
import {
  InMemoryNotificationRepository,
  InMemoryPreferenceRepository,
  InMemoryRateLimitRepository,
  FakeRecipientResolver,
  FakeChannel,
  identityTranslator,
} from './test-doubles';

describe('notification preferences', () => {
  describe('entity: channel mutability (BR-NOT-003)', () => {
    it('allows muting the PUSH channel for a non-safety Normal/Low category', () => {
      const pref = NotificationPreference.create({
        userId: 'u1',
        companyId: 'c1',
        category: 'GENERAL',
        channel: 'PUSH',
        frequency: 'IMMEDIATE',
        isEnabled: true,
      });
      pref.setEnabled(false, 'LOW', false);
      expect(pref.isEnabled).toBe(false);
    });

    it('allows muting PUSH/EMAIL for a Critical safety notification (channel is mutable)', () => {
      const pref = NotificationPreference.create({
        userId: 'u1',
        companyId: 'c1',
        category: 'SECURITY',
        channel: 'PUSH',
        frequency: 'IMMEDIATE',
        isEnabled: true,
      });
      pref.setEnabled(false, 'CRITICAL', true);
      expect(pref.isEnabled).toBe(false);
    });

    it('CANNOT suppress the existence of a Critical/High safety notification (IN_APP stays enabled)', () => {
      const pref = NotificationPreference.create({
        userId: 'u1',
        companyId: 'c1',
        category: 'SECURITY',
        channel: 'IN_APP',
        frequency: 'IMMEDIATE',
        isEnabled: true,
      });
      pref.setEnabled(false, 'CRITICAL', true);
      expect(pref.isEnabled).toBe(true);
    });
  });

  describe('Billing & Trial mutability (BR-NOT-004)', () => {
    it('cannot be muted in the final 4 days of trial', () => {
      expect(isChannelMutable('BILLING_TRIAL', 'PUSH', 4)).toBe(false);
      expect(isChannelMutable('BILLING_TRIAL', 'EMAIL', 1)).toBe(false);
      expect(isChannelMutable('BILLING_TRIAL', 'IN_APP', 0)).toBe(false);
    });

    it('can be muted when outside the final 4 days or not in trial', () => {
      expect(isChannelMutable('BILLING_TRIAL', 'PUSH', 10)).toBe(true);
      expect(isChannelMutable('BILLING_TRIAL', 'EMAIL', null)).toBe(true);
    });

    it('other categories are always mutable', () => {
      expect(isChannelMutable('INVENTORY', 'PUSH', 1)).toBe(true);
      expect(isChannelMutable('GENERAL', 'EMAIL', null)).toBe(true);
    });
  });

  describe('dispatcher honors channel muting', () => {
    class ReorderPointReached {
      constructor(
        public companyId: string,
        public productId: string,
        public quantityOnHand: number,
      ) {}
    }

    it('a user who muted PUSH still receives the in-app record but no push', async () => {
      const repo = new InMemoryNotificationRepository();
      const preferenceRepo = new InMemoryPreferenceRepository();
      const push = new FakeChannel('PUSH');
      const email = new FakeChannel('EMAIL');
      const dispatcher = new NotificationDispatcher({
        handlers: [new LowStockAlertHandler()],
        channels: [push, email],
        notificationRepo: repo,
        preferenceRepo,
        rateLimitRepo: new InMemoryRateLimitRepository(),
        resolver: new FakeRecipientResolver(),
        translator: identityTranslator,
      });

      // mgr1 muted PUSH for INVENTORY.
      preferenceRepo.rows.push({
        userId: 'mgr1',
        companyId: 'company-1',
        category: 'INVENTORY',
        channel: 'PUSH',
        frequency: 'IMMEDIATE',
        isEnabled: false,
      });

      await dispatcher.dispatch(
        new ReorderPointReached('company-1', 'prod-1', 5) as unknown as DomainEventBase,
      );

      // In-app record still created for the muted user.
      expect(repo.store.some((n) => n.recipientUserId === 'mgr1' && n.triggerCode === 'LOW_STOCK')).toBe(
        true,
      );
      // No push delivered to the muted user.
      expect(push.sent.some((s) => s.recipientUserId === 'mgr1')).toBe(false);
      // Owner (not muted) still gets push.
      expect(push.sent.some((s) => s.recipientUserId === 'owner1')).toBe(true);
    });
  });
});
