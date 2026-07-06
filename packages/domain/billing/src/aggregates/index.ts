import { Identifier } from '@packages/shared-kernel';
import { SubscriptionStatus, LockReason, PlanFeatureFlags } from '../value-objects';
import { SubscriptionPlan } from '../entities';

export interface SubscriptionProps {
  id: string;
  companyId: string;
  planId: string | null;
  status: SubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  lockedAt: string | null;
  lockReason: LockReason | null;
  isFullAccessOverride: boolean;
  overrideExpiresAt: string | null;
  overrideReason: string | null;
  overrideGrantedByPlatformAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription aggregate — manages the trial-to-paid lifecycle.
 * Entitlement resolution follows the 5-step precedence in Database.md §2.16.1.
 */
export class Subscription {
  public readonly id: string;
  public readonly companyId: string;
  private _planId: string | null;
  private _status: SubscriptionStatus;
  public readonly trialStartedAt: string;
  public readonly trialEndsAt: string;
  private _currentPeriodStart: string | null;
  private _currentPeriodEnd: string | null;
  private _lockedAt: string | null;
  private _lockReason: LockReason | null;
  private _isFullAccessOverride: boolean;
  private _overrideExpiresAt: string | null;
  private _overrideReason: string | null;
  private _overrideGrantedByPlatformAdminId: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._planId = props.planId;
    this._status = props.status;
    this.trialStartedAt = props.trialStartedAt;
    this.trialEndsAt = props.trialEndsAt;
    this._currentPeriodStart = props.currentPeriodStart;
    this._currentPeriodEnd = props.currentPeriodEnd;
    this._lockedAt = props.lockedAt;
    this._lockReason = props.lockReason;
    this._isFullAccessOverride = props.isFullAccessOverride;
    this._overrideExpiresAt = props.overrideExpiresAt;
    this._overrideReason = props.overrideReason;
    this._overrideGrantedByPlatformAdminId = props.overrideGrantedByPlatformAdminId;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static startTrial(companyId: string, trialDays: number = 14): Subscription {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDays);
    const nowIso = now.toISOString();
    return new Subscription({
      id: Identifier.generate(),
      companyId,
      planId: null,
      status: 'trialing',
      trialStartedAt: nowIso,
      trialEndsAt: trialEnd.toISOString(),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      lockedAt: null,
      lockReason: null,
      isFullAccessOverride: false,
      overrideExpiresAt: null,
      overrideReason: null,
      overrideGrantedByPlatformAdminId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  public static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public get status(): SubscriptionStatus {
    return this._status;
  }
  public get planId(): string | null {
    return this._planId;
  }
  public get lockedAt(): string | null {
    return this._lockedAt;
  }
  public get lockReason(): LockReason | null {
    return this._lockReason;
  }
  public get isFullAccessOverride(): boolean {
    return this._isFullAccessOverride;
  }
  public get overrideExpiresAt(): string | null {
    return this._overrideExpiresAt;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  /** Resolves effective entitlement per Database.md §2.16.1 (5-step precedence). */
  public resolveEntitlement(
    plan: SubscriptionPlan | null,
    asOf: Date = new Date(),
  ): 'full' | 'plan' | 'locked' {
    // Step 1: active full-access override
    if (this._isFullAccessOverride) {
      if (!this._overrideExpiresAt || new Date(this._overrideExpiresAt) > asOf) return 'full';
    }
    // Step 2: active trial
    if (this._status === 'trialing' && new Date(this.trialEndsAt) > asOf) return 'full';
    // Step 3: active paid plan
    if (this._status === 'active' && plan) return 'plan';
    // Step 4: past_due within grace period
    if (this._status === 'past_due' && plan) return 'plan';
    // Step 5: locked
    return 'locked';
  }

  public isWriteLocked(asOf: Date = new Date()): boolean {
    if (this._status === 'locked' || this._status === 'suspended') return true;
    if (this._status === 'trialing' && new Date(this.trialEndsAt) <= asOf) return true;
    return false;
  }

  public activate(planId: string, periodStart: string, periodEnd: string): void {
    this._planId = planId;
    this._status = 'active';
    this._currentPeriodStart = periodStart;
    this._currentPeriodEnd = periodEnd;
    this._lockedAt = null;
    this._lockReason = null;
    this._updatedAt = new Date().toISOString();
  }

  public expireTrial(): void {
    if (this._status !== 'trialing') throw new Error('Cannot expire a non-trialing subscription');
    this._status = 'locked';
    this._lockedAt = new Date().toISOString();
    this._lockReason = 'trial_expired';
    this._updatedAt = this._lockedAt;
  }

  public markPastDue(): void {
    this._status = 'past_due';
    this._updatedAt = new Date().toISOString();
  }

  public lock(reason: LockReason): void {
    this._status = 'locked';
    this._lockedAt = new Date().toISOString();
    this._lockReason = reason;
    this._updatedAt = this._lockedAt;
  }

  public suspend(grantedByAdminId: string, reason: string): void {
    this._status = 'suspended';
    this._lockedAt = new Date().toISOString();
    this._lockReason = 'platform_admin_manual';
    this._overrideGrantedByPlatformAdminId = grantedByAdminId;
    this._overrideReason = reason;
    this._updatedAt = this._lockedAt;
  }

  public reactivate(): void {
    this._status = this._planId ? 'active' : 'trialing';
    this._lockedAt = null;
    this._lockReason = null;
    this._updatedAt = new Date().toISOString();
  }

  public grantFullAccessOverride(adminId: string, reason: string, expiresAt: string | null): void {
    this._isFullAccessOverride = true;
    this._overrideGrantedByPlatformAdminId = adminId;
    this._overrideReason = reason;
    this._overrideExpiresAt = expiresAt;
    this._updatedAt = new Date().toISOString();
  }

  public revokeFullAccessOverride(): void {
    this._isFullAccessOverride = false;
    this._overrideGrantedByPlatformAdminId = null;
    this._overrideReason = null;
    this._overrideExpiresAt = null;
    this._updatedAt = new Date().toISOString();
  }

  /** Stub to satisfy type consumers — full feature resolution requires the plan entity */
  public getFeatureFlags(_plan: SubscriptionPlan): PlanFeatureFlags | null {
    if (this.resolveEntitlement(_plan) === 'full') {
      return {
        aiAssistant: true,
        ocr: true,
        fraudDetection: true,
        customRoles: true,
        branchLimit: null,
        userLimit: null,
      };
    }
    if (this.resolveEntitlement(_plan) === 'plan') return _plan.featureFlags as PlanFeatureFlags;
    return null;
  }
}
