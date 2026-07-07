import { describe, it, expect, vi } from 'vitest';
import { ExtendTrial } from './platform-admin-extend-trial';
import { PlatformAdminUser, PlatformAdminAction } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

describe('ExtendTrial', () => {
  it('extends trial end date and records admin action', async () => {
    const admin = PlatformAdminUser.create({
      name: 'Ops',
      email: 'ops@example.com',
      passwordHash: 'hash',
      role: 'super_admin',
      mfaSecret: 'secret',
      isMfaEnrolled: true,
      isActive: true,
    });

    const subscription = new Subscription({
      id: 'sub_1',
      companyId: 'company-1',
      planId: null,
      status: 'trialing',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
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

    const newTrialEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const adminById = vi.fn().mockResolvedValue(admin);
    const repo = {
      findByCompany: vi.fn().mockResolvedValue(subscription),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const recordAction = vi.fn().mockResolvedValue(undefined);

    const useCase = new ExtendTrial(
      adminById as (id: string) => Promise<PlatformAdminUser | null>,
      repo as {
        findByCompany: (companyId: string) => Promise<Subscription | null>;
        save: (s: Subscription) => Promise<void>;
      },
      recordAction as (action: PlatformAdminAction) => Promise<void>,
    );
    const result = await useCase.execute({
      adminId: admin.id,
      companyId: 'company-1',
      newTrialEndsAt,
      reason: 'goodwill extension',
    });

    expect(result.subscription.status).toBe('trialing');
    expect(result.subscription.trialEndsAt).toBe(newTrialEndsAt);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledTimes(1);
  });
});
