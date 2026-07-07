export type PlatformAdminRole = 'super_admin' | 'support';

export type PlatformAdminActionCode =
  | 'plan_changed'
  | 'override_granted'
  | 'override_revoked'
  | 'account_locked'
  | 'account_unlocked'
  | 'trial_extended'
  | 'admin_login'
  | 'admin_logout'
  | 'admin_login_failed';

export interface TenantOverrideProps {
  platformAdminId: string;
  reason: string;
  grantedAt: string;
  expiresAt: string | null;
}

export class TenantOverride {
  public readonly platformAdminId: string;
  public readonly reason: string;
  public readonly grantedAt: string;
  public readonly expiresAt: string | null;

  private constructor(props: TenantOverrideProps) {
    if (!props.reason || props.reason.trim().length === 0) {
      throw new Error('TenantOverride: reason is mandatory');
    }
    this.platformAdminId = props.platformAdminId;
    this.reason = props.reason;
    this.grantedAt = props.grantedAt;
    this.expiresAt = props.expiresAt;
  }

  public static create(props: Omit<TenantOverrideProps, 'grantedAt'>): TenantOverride {
    return new TenantOverride({
      ...props,
      grantedAt: new Date().toISOString(),
    });
  }

  public isActive(asOf: Date = new Date()): boolean {
    return this.expiresAt === null || new Date(this.expiresAt) > asOf;
  }
}
