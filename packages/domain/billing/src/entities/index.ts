import { Identifier } from '@packages/shared-kernel';
import { PlanCode, PlanFeatureFlags } from '../value-objects';

// ─── SubscriptionPlan ─────────────────────────────────────────────────────────

export interface SubscriptionPlanProps {
  id: string;
  code: PlanCode;
  name: string;
  monthlyPriceEgp: number;
  featureFlags: PlanFeatureFlags;
  isActive: boolean;
}

export class SubscriptionPlan {
  public readonly id: string;
  public readonly code: PlanCode;
  public readonly name: string;
  public readonly monthlyPriceEgp: number;
  public readonly featureFlags: Readonly<PlanFeatureFlags>;
  private _isActive: boolean;

  private constructor(props: SubscriptionPlanProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.monthlyPriceEgp = props.monthlyPriceEgp;
    this.featureFlags = Object.freeze({ ...props.featureFlags });
    this._isActive = props.isActive;
  }

  public static create(props: Omit<SubscriptionPlanProps, 'id'>): SubscriptionPlan {
    return new SubscriptionPlan({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: SubscriptionPlanProps): SubscriptionPlan {
    return new SubscriptionPlan(props);
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public retire(): void {
    this._isActive = false;
  }

  public isFeatureEnabled(feature: keyof PlanFeatureFlags): boolean {
    const flag = this.featureFlags[feature];
    return flag === true || flag === 'partial';
  }
}

// ─── LicenseKey ───────────────────────────────────────────────────────────────

export interface LicenseKeyProps {
  id: string;
  companyId: string;
  keyHash: string;
  activatedAt: string;
  lastValidatedAt: string;
  gracePeriodEndsAt: string | null;
}

export class LicenseKey {
  public readonly id: string;
  public readonly companyId: string;
  public readonly keyHash: string;
  public readonly activatedAt: string;
  private _lastValidatedAt: string;
  private _gracePeriodEndsAt: string | null;

  private constructor(props: LicenseKeyProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.keyHash = props.keyHash;
    this.activatedAt = props.activatedAt;
    this._lastValidatedAt = props.lastValidatedAt;
    this._gracePeriodEndsAt = props.gracePeriodEndsAt;
  }

  public static create(props: Omit<LicenseKeyProps, 'id'>): LicenseKey {
    return new LicenseKey({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: LicenseKeyProps): LicenseKey {
    return new LicenseKey(props);
  }

  public get lastValidatedAt(): string {
    return this._lastValidatedAt;
  }
  public get gracePeriodEndsAt(): string | null {
    return this._gracePeriodEndsAt;
  }

  public recordValidation(at: string, gracePeriodEndsAt: string): void {
    this._lastValidatedAt = at;
    this._gracePeriodEndsAt = gracePeriodEndsAt;
  }

  public isWithinGracePeriod(asOf: Date = new Date()): boolean {
    if (!this._gracePeriodEndsAt) return false;
    return new Date(this._gracePeriodEndsAt) > asOf;
  }
}
