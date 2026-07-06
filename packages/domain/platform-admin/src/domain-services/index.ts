import { Result } from '@packages/shared-kernel';
import { PlatformAdminUser } from '../aggregates';
import { PlatformAdminAction } from '../entities';
import { PlatformAdminActionCode } from '../value-objects';

/**
 * PlatformAdminGuard enforces that no tenant-facing code path can ever
 * reach Platform Administration capabilities (Architecture.md §3.1).
 *
 * This service is the domain-level enforcement: all platform-admin commands
 * must validate through here before executing.
 */
export class PlatformAdminGuard {
  /**
   * Verifies the acting admin is active, enrolled in MFA, and not locked out.
   */
  public static authorize(admin: PlatformAdminUser, asOf: Date = new Date()): Result<void, string> {
    if (!admin.isActive) return Result.fail('Platform admin account is deactivated');
    if (!admin.isMfaEnrolled) return Result.fail('MFA enrollment required before any action');
    if (admin.isLockedOut(asOf)) return Result.fail('Platform admin account is locked out');
    return Result.ok(undefined);
  }

  /**
   * Validates that a reason string is non-empty (BR-XCT-003).
   */
  public static validateReason(reason: string): Result<void, string> {
    if (!reason || reason.trim().length === 0)
      return Result.fail('A non-empty reason is mandatory for every Platform Admin action');
    return Result.ok(undefined);
  }
}

/**
 * PlatformAdminActionRecorder creates immutable cross-tenant audit records
 * for every Platform Admin mutation.
 */
export interface PlatformAdminActionRepository {
  record(action: PlatformAdminAction): Promise<void>;
  findByCompany(companyId: string): Promise<PlatformAdminAction[]>;
  findByAdmin(adminId: string): Promise<PlatformAdminAction[]>;
}

export class PlatformAdminActionRecorder {
  public constructor(private readonly repo: PlatformAdminActionRepository) {}

  public async record(props: {
    platformAdminId: string;
    targetCompanyId: string;
    actionCode: PlatformAdminActionCode;
    reason: string;
    before?: object;
    after?: object;
  }): Promise<PlatformAdminAction> {
    const action = PlatformAdminAction.record({
      platformAdminId: props.platformAdminId,
      targetCompanyId: props.targetCompanyId,
      actionCode: props.actionCode,
      reason: props.reason,
      beforeJson: props.before ? JSON.stringify(props.before) : null,
      afterJson: props.after ? JSON.stringify(props.after) : null,
    });
    await this.repo.record(action);
    return action;
  }
}
