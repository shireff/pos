import { User } from '@packages/domain-identity';
import { Role } from '@packages/domain-identity';
import { Device } from '@packages/domain-identity';
import { Subscription } from '@packages/domain-billing';

/** Port: SubscriptionRepository — implemented in infrastructure/mongodb */
export interface SubscriptionRepository {
  findByCompany(companyId: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
}

/** Port: UserRepository — implemented in infrastructure/mongodb */
export interface UserRepository {
  findById(id: string, companyId: string): Promise<User | null>;
  findByEmail(email: string, companyId: string): Promise<User | null>;
  findByPhone(phone: string, companyId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findAll(companyId: string): Promise<User[]>;
}

/** Port: RoleRepository */
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCompany(companyId: string): Promise<Role[]>;
  findSystemRoles(): Promise<Role[]>;
  save(role: Role): Promise<void>;
}

/** Port: DeviceRepository */
export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByFingerprint(fingerprint: string, companyId: string): Promise<Device | null>;
  findByCompany(companyId: string): Promise<Device[]>;
  save(device: Device): Promise<void>;
}

/** Port: PermissionCodeRepository */
export interface PermissionCodeRepository {
  findCodesForRole(roleId: string): Promise<string[]>;
  findRoleIdsForUserBranch(userId: string, branchId: string): Promise<string[]>;
  isOwner(userId: string, companyId: string): Promise<boolean>;
}

/** Port: PasswordHasher */
export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, hash: string): Promise<boolean>;
}

export interface RefreshTokenRecord {
  tokenHash: string;
  userId: string;
  companyId: string;
  branchRoles: string[];
  issuedAt: string;
  revokedAt: string | null;
}

/** Port: RefreshTokenRepository */
export interface RefreshTokenRepository {
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  save(record: RefreshTokenRecord): Promise<void>;
  revoke(tokenHash: string): Promise<void>;
}

/** Port: TokenIssuer */
export interface TokenIssuer {
  issueAccessToken(payload: { userId: string; companyId: string; branchRoles: string[] }): string;
  issueRefreshToken(): string;
  hashToken(token: string): string;
  verifyAccessToken(
    token: string,
  ): { userId: string; companyId: string; branchRoles: string[] } | null;
}
