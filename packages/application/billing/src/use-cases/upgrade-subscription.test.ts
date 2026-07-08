import { describe, it, expect, vi } from 'vitest';
import { UpgradeSubscription } from './upgrade-subscription';
import { Subscription } from '@packages/domain-billing';
import type { SubscriptionRepository } from '../ports';

describe('UpgradeSubscription', () => {
  it('activates an existing trial subscription for a selected plan', async () => {
    const subscription = new Subscription({
      id: 'sub_1',
      companyId: 'company-1',
      planId: null,
      status: 'trial',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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

    const save = vi.fn().mockResolvedValue(undefined);
    const repo = {
      findByCompany: vi.fn().mockResolvedValue(subscription),
      save,
      findTrialsEndingBefore: vi.fn().mockResolvedValue([]),
    };

    const useCase = new UpgradeSubscription(repo as SubscriptionRepository);
    const result = await useCase.execute({ companyId: 'company-1', planId: 'pro' });

    expect(result.subscription.status).toBe('active');
    expect(result.subscription.planId).toBe('pro');
    expect(save).toHaveBeenCalledTimes(1);
  });
});
