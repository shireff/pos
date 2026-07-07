import { Identifier } from '@packages/shared-kernel';

// ─── Permission ──────────────────────────────────────────────────────────────

/** Input shape for a permission entity. */
export interface PermissionProps {
  id: string;
  module: string;
  action: string;
  code: string; // `${module}.${action}`
}

/** Permission entity representing a single capability code within the RBAC model. */
export class Permission {
  public readonly id: string;
  public readonly module: string;
  public readonly action: string;
  public readonly code: string;

  private constructor(props: PermissionProps) {
    this.id = props.id;
    this.module = props.module;
    this.action = props.action;
    this.code = props.code;
  }

  public static create(module: string, action: string): Permission {
    return new Permission({
      id: Identifier.generate(),
      module,
      action,
      code: `${module}.${action}`,
    });
  }

  public static reconstitute(props: PermissionProps): Permission {
    return new Permission(props);
  }
}

// ─── Role ────────────────────────────────────────────────────────────────────

/** Input shape for a role entity. */
export interface RoleProps {
  id: string;
  companyId: string | null; // null = system-predefined role
  name: string;
  isSystemRole: boolean;
  permissionIds: string[];
}

/** Role entity that can be assigned to users for branch-scoped permissions. */
export class Role {
  public readonly id: string;
  public readonly companyId: string | null;
  public readonly name: string;
  public readonly isSystemRole: boolean;
  private _permissionIds: string[];

  private constructor(props: RoleProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.name = props.name;
    this.isSystemRole = props.isSystemRole;
    this._permissionIds = [...props.permissionIds];
  }

  public static create(props: Omit<RoleProps, 'id'>): Role {
    return new Role({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: RoleProps): Role {
    return new Role(props);
  }

  public get permissionIds(): readonly string[] {
    return this._permissionIds;
  }

  public addPermission(permissionId: string): void {
    if (!this._permissionIds.includes(permissionId)) {
      this._permissionIds.push(permissionId);
    }
  }

  public removePermission(permissionId: string): void {
    this._permissionIds = this._permissionIds.filter((p) => p !== permissionId);
  }

  public hasPermission(permissionId: string): boolean {
    return this._permissionIds.includes(permissionId);
  }
}

// ─── UserBranchRole ──────────────────────────────────────────────────────────

/** Input shape for a user-branch-role assignment. */
export interface UserBranchRoleProps {
  userId: string;
  branchId: string;
  roleId: string;
}

/** Assignment linking a user to a branch with a role for RBAC evaluation. */
export class UserBranchRole {
  public readonly userId: string;
  public readonly branchId: string;
  public readonly roleId: string;

  private constructor(props: UserBranchRoleProps) {
    this.userId = props.userId;
    this.branchId = props.branchId;
    this.roleId = props.roleId;
  }

  public static create(props: UserBranchRoleProps): UserBranchRole {
    return new UserBranchRole(props);
  }

  public static reconstitute(props: UserBranchRoleProps): UserBranchRole {
    return new UserBranchRole(props);
  }
}

// ─── Device ──────────────────────────────────────────────────────────────────

export type DeviceType = 'desktop' | 'android';

/** Input shape for a device entity. */
export interface DeviceProps {
  id: string;
  companyId: string;
  deviceType: DeviceType;
  deviceFingerprint: string;
  registeredAt: string; // ISO UTC
  lastSeenAt: string; // ISO UTC
  isRevoked: boolean;
}

/** Device entity that tracks registration and revocation for licensing and sync. */
export class Device {
  public readonly id: string;
  public readonly companyId: string;
  public readonly deviceType: DeviceType;
  public readonly deviceFingerprint: string;
  public readonly registeredAt: string;
  private _lastSeenAt: string;
  private _isRevoked: boolean;

  private constructor(props: DeviceProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.deviceType = props.deviceType;
    this.deviceFingerprint = props.deviceFingerprint;
    this.registeredAt = props.registeredAt;
    this._lastSeenAt = props.lastSeenAt;
    this._isRevoked = props.isRevoked;
  }

  public static register(props: Omit<DeviceProps, 'id' | 'isRevoked'>): Device {
    return new Device({
      id: Identifier.generate(),
      isRevoked: false,
      ...props,
    });
  }

  public static reconstitute(props: DeviceProps): Device {
    return new Device(props);
  }

  public get lastSeenAt(): string {
    return this._lastSeenAt;
  }
  public get isRevoked(): boolean {
    return this._isRevoked;
  }

  public updateLastSeen(at: string): void {
    this._lastSeenAt = at;
  }

  public revoke(): void {
    if (this._isRevoked) throw new Error('Device is already revoked');
    this._isRevoked = true;
  }
}
