export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'trial_expired' | 'cancelled';
export type SubscriptionPlanTier = 'trial' | 'starter' | 'growth' | 'enterprise';
export type DevicePlatform = 'desktop' | 'android';
export type PlatformAdminRole = 'super_admin' | 'support';

export interface SubscriptionPlanProps {
  id: string;
  companyId: string;
  name: string;
  tier: SubscriptionPlanTier;
  monthlyPricePiasters: number;
  annualPricePiasters: number;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionPlan {
  public readonly id: string;
  public readonly companyId: string;
  public readonly name: string;
  public readonly tier: SubscriptionPlanTier;
  public readonly monthlyPricePiasters: number;
  public readonly annualPricePiasters: number;
  public readonly maxUsers: number;
  public isActive: boolean;
  public readonly createdAt: string;
  public updatedAt: string;

  public constructor(props: SubscriptionPlanProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.name = props.name;
    this.tier = props.tier;
    this.monthlyPricePiasters = props.monthlyPricePiasters;
    this.annualPricePiasters = props.annualPricePiasters;
    this.maxUsers = props.maxUsers;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}

export interface SubscriptionProps {
  id: string;
  companyId: string;
  planId: string | null;
  status: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Subscription {
  public readonly id: string;
  public readonly companyId: string;
  public planId: string | null;
  public status: SubscriptionStatus;
  public trialStartedAt: string | null;
  public trialEndsAt: string | null;
  public activatedAt: string | null;
  public suspendedAt: string | null;
  public readonly createdAt: string;
  public updatedAt: string;

  public constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.planId = props.planId;
    this.status = props.status;
    this.trialStartedAt = props.trialStartedAt;
    this.trialEndsAt = props.trialEndsAt;
    this.activatedAt = props.activatedAt;
    this.suspendedAt = props.suspendedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public startTrial(now: string): void {
    this.status = 'trial';
    this.trialStartedAt = now;
    this.trialEndsAt = new Date(new Date(now).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    this.updatedAt = now;
  }

  public expireTrial(now: string): void {
    this.status = 'trial_expired';
    this.updatedAt = now;
  }

  public activate(planId: string, now: string): void {
    this.planId = planId;
    this.status = 'active';
    this.activatedAt = now;
    this.updatedAt = now;
  }

  public suspend(now: string): void {
    this.status = 'suspended';
    this.suspendedAt = now;
    this.updatedAt = now;
  }
}

export interface LicenseKeyProps {
  id: string;
  companyId: string;
  key: string;
  planId: string | null;
  isUsed: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export class LicenseKey {
  public readonly id: string;
  public readonly companyId: string;
  public readonly key: string;
  public planId: string | null;
  public isUsed: boolean;
  public expiresAt: string | null;
  public readonly createdAt: string;

  public constructor(props: LicenseKeyProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.key = props.key;
    this.planId = props.planId;
    this.isUsed = props.isUsed;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }
}

export interface PlatformAdminAccountProps {
  id: string;
  email: string;
  role: PlatformAdminRole;
  passwordHash: string;
  mfaSecret: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PlatformAdminAccount {
  public readonly id: string;
  public readonly email: string;
  public role: PlatformAdminRole;
  public passwordHash: string;
  public mfaSecret: string | null;
  public isActive: boolean;
  public failedLoginAttempts: number;
  public lockedUntil: string | null;
  public readonly createdAt: string;
  public updatedAt: string;

  public constructor(props: PlatformAdminAccountProps) {
    this.id = props.id;
    this.email = props.email;
    this.role = props.role;
    this.passwordHash = props.passwordHash;
    this.mfaSecret = props.mfaSecret;
    this.isActive = props.isActive;
    this.failedLoginAttempts = props.failedLoginAttempts;
    this.lockedUntil = props.lockedUntil;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
