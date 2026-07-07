import { describe, it, expect, vi } from 'vitest';
import { ReactivateTenant } from './platform-admin-reactivate-tenant';
import { PlatformAdminUser, PlatformAdminAction } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

describe('ReactivateTenant', () => {
  it('reactivates a suspended subscription and records admin action', async () => {
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
      status: 'suspended',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      lockedAt: new Date().toISOString(),
      lockReason: 'platform_admin_manual',
      isFullAccessOverride: false,
      overrideExpiresAt: null,
      overrideReason: null,
      overrideGrantedByPlatformAdminId: admin.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminById = vi.fn().mockResolvedValue(admin);
    const repo = {
      findByCompany: vi.fn().mockResolvedValue(subscription),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const recordAction = vi.fn().mockResolvedValue(undefined);

    const useCase = new ReactivateTenant(
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
      reason: 'issue resolved',
    });

    expect(result.subscription.status).toBe('active');
    expect(result.subscription.lockReason).toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledTimes(1);
  });
});
