/**
 * RBAC Middleware — Permission Resolution & Enforcement
 *
 * Resolves user's effective permissions from user_branch_roles → role_permissions.
 * Implements Owner short-circuit: Owner role has all permissions across all branches.
 * Also implements `requirePlatformAdmin` middleware for platform-admin token validation.
 */

export interface PermissionResolverPorts {
  findUserBranchRoles: (
    userId: string,
    companyId: string,
  ) => Promise<Array<{ roleId: string; branchId: string }>>;
  findRolePermissions: (roleId: string) => Promise<string[]>;
  isOwner: (userId: string, companyId: string) => Promise<boolean>;
}

export class PermissionResolver {
  public constructor(private readonly ports: PermissionResolverPorts) {}

  /**
   * Resolve effective permissions for user in a specific branch.
   * 1. Check if user is Owner → return full permission set
   * 2. Find user_branch_roles for (userId, branchId)
   * 3. For each role, fetch role_permissions
   * 4. Return union of all permissions
   */
  public async resolvePermissions(
    userId: string,
    companyId: string,
    branchId: string,
  ): Promise<Set<string>> {
    // Owner short-circuit
    if (await this.ports.isOwner(userId, companyId)) {
      return new Set([
        'subscription.view',
        'subscription.upgrade',
        'user.create',
        'user.update',
        'user.delete',
        'role.manage',
        'permission.view',
        'device.register',
        'device.revoke',
        'audit.view',
        'backup.create',
        'backup.restore',
        'sync.view',
      ]);
    }

    const userBranchRoles = await this.ports.findUserBranchRoles(userId, companyId);
    const branchRoles = userBranchRoles.filter((ubr) => ubr.branchId === branchId);

    const permissions = new Set<string>();
    for (const ubr of branchRoles) {
      const rolePerms = await this.ports.findRolePermissions(ubr.roleId);
      rolePerms.forEach((p) => permissions.add(p));
    }

    return permissions;
  }
}

/**
 * requirePlatformAdmin middleware validator
 * Extracts aud claim from adminAccessToken and validates it equals "platform-admin"
 */
export class PlatformAdminGuard {
  public validateAdminToken(token: string): { adminId: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload.aud !== 'platform-admin') return null;

      return { adminId: payload.adminId };
    } catch {
      return null;
    }
  }
}
