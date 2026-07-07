import { Subscription, LicenseKey, PlatformAdminAccount } from '../aggregates';

export interface AuthDomainService {
  createTrialSubscription(companyId: string, now: string): Subscription;
  activateSubscription(companyId: string, planId: string, now: string): Subscription;
  suspendSubscription(companyId: string, now: string): Subscription;
  issueLicenseKey(companyId: string, planId: string | null, key: string, now: string): LicenseKey;
  createPlatformAdmin(
    email: string,
    passwordHash: string,
    role: 'super_admin' | 'support',
    now: string,
  ): PlatformAdminAccount;
}

export class IdentityAuthDomainService implements AuthDomainService {
  public createTrialSubscription(companyId: string, now: string): Subscription {
    return new Subscription({
      id: `sub_${companyId}`,
      companyId,
      planId: null,
      status: 'trial',
      trialStartedAt: now,
      trialEndsAt: new Date(new Date(now).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      activatedAt: null,
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public activateSubscription(companyId: string, planId: string, now: string): Subscription {
    return new Subscription({
      id: `sub_${companyId}`,
      companyId,
      planId,
      status: 'active',
      trialStartedAt: null,
      trialEndsAt: null,
      activatedAt: now,
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public suspendSubscription(companyId: string, now: string): Subscription {
    return new Subscription({
      id: `sub_${companyId}`,
      companyId,
      planId: null,
      status: 'suspended',
      trialStartedAt: null,
      trialEndsAt: null,
      activatedAt: null,
      suspendedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  public issueLicenseKey(
    companyId: string,
    planId: string | null,
    key: string,
    now: string,
  ): LicenseKey {
    return new LicenseKey({
      id: `license_${companyId}`,
      companyId,
      key,
      planId,
      isUsed: false,
      expiresAt: null,
      createdAt: now,
    });
  }

  public createPlatformAdmin(
    email: string,
    passwordHash: string,
    role: 'super_admin' | 'support',
    now: string,
  ): PlatformAdminAccount {
    return new PlatformAdminAccount({
      id: `platform_admin_${email}`,
      email,
      role,
      passwordHash,
      mfaSecret: null,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
