import { describe, it, expect, vi } from 'vitest';
import { ExpireTrialJob } from './expire-trial';
import { Subscription } from '@packages/domain-billing';
import type { SubscriptionRepository, TrialNotificationDispatcher } from '../ports';

describe('ExpireTrialJob', () => {
  it('expires trials ending before given date and notifies', async () => {
    const past = new Date(Date.now() - 1000).toISOString();

    const sub = new Subscription({
      id: 'sub_1',
      companyId: 'company-1',
      planId: null,
      status: 'trialing',
      trialStartedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      trialEndsAt: past,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      lockedAt: null,
      lockReason: null,
      isFullAccessOverride: false,
      overrideExpiresAt: null,
      overrideReason: null,
      overrideGrantedByPlatformAdminId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const findTrialsEndingBefore = vi.fn().mockResolvedValue([sub]);
    const save = vi.fn().mockResolvedValue(undefined);
    const notifier = {
      dispatchTrialExpired: vi.fn().mockResolvedValue(undefined),
      dispatchTrialCountdown: vi.fn().mockResolvedValue(undefined),
      dispatchSubscriptionActivated: vi.fn().mockResolvedValue(undefined),
    };

    const repo: Pick<SubscriptionRepository, 'findTrialsEndingBefore' | 'save'> = {
      findTrialsEndingBefore,
      save,
    };
    const job = new ExpireTrialJob(
      repo as SubscriptionRepository,
      notifier as TrialNotificationDispatcher,
    );

    const result = await job.run({ asOfIso: new Date().toISOString() });

    expect(result.processed).toBe(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(notifier.dispatchTrialExpired).toHaveBeenCalledWith('company-1');
    expect(sub.status).toBe('locked');
    expect(sub.lockReason).toBe('trial_expired');
  });
});
