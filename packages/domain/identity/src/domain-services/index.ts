import { Result } from '@packages/shared-kernel';
import { Role } from '../entities';

/** Repository interface for permission resolution — implemented in infrastructure layer. */
export interface PermissionRepository {
  findCodesForRole(roleId: string): Promise<string[]>;
  findRolesForUserBranch(userId: string, branchId: string): Promise<Role[]>;
  isOwner(userId: string, companyId: string): Promise<boolean>;
}

/**
 * PermissionResolver evaluates a user's effective permission set for a given branch.
 * Owners receive a cross-branch short-circuit (all permissions granted).
 * All other users have their roles resolved via user_branch_roles.
 */
export class PermissionResolver {
  public constructor(private readonly repo: PermissionRepository) {}

  /**
   * Returns the set of permission codes for a user at a specific branch.
   * If the user is an Owner, returns ['*'] as a sentinel (infinite permissions).
   */
  public async resolve(
    userId: string,
    companyId: string,
    branchId: string,
  ): Promise<Result<Set<string>, string>> {
    const isOwner = await this.repo.isOwner(userId, companyId);
    if (isOwner) {
      return Result.ok(new Set(['*']));
    }

    const roles = await this.repo.findRolesForUserBranch(userId, branchId);
    if (roles.length === 0) {
      return Result.ok(new Set<string>());
    }

    const codeArrays = await Promise.all(roles.map((r) => this.repo.findCodesForRole(r.id)));
    const codes = new Set(codeArrays.flat());
    return Result.ok(codes);
  }

  /**
   * Returns true if the resolved permission set includes the required code.
   * If set contains '*', the user is an Owner and all permissions are granted.
   */
  public static can(permissions: Set<string>, requiredCode: string): boolean {
    return permissions.has('*') || permissions.has(requiredCode);
  }
}
