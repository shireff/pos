import { describe, it, expect, vi } from 'vitest';
import { SuspendTenant } from './platform-admin-suspend-tenant';
import { PlatformAdminUser, PlatformAdminAction } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

describe('SuspendTenant', () => {
  it('suspends the subscription and records admin action', async () => {
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
      planId: 'pro',
      status: 'active',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lockedAt: null,
      lockReason: null,
      isFullAccessOverride: false,
      overrideExpiresAt: null,
      overrideReason: null,
      overrideGrantedByPlatformAdminId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminById = vi.fn().mockResolvedValue(admin);
    const repo = {
      findByCompany: vi.fn().mockResolvedValue(subscription),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const recordAction = vi.fn().mockResolvedValue(undefined);

    const useCase = new SuspendTenant(
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
      reason: 'security issue',
    });

    expect(result.subscription.status).toBe('suspended');
    expect(result.subscription.lockReason).toBe('platform_admin_manual');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledTimes(1);
  });
});
