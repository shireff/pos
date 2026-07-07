import { NextRequest } from 'next/server';
import { Db } from 'mongodb';
import { ForbiddenError, UnauthorizedError } from './errors';
import { getMongoDb } from './cloud-db';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  companyId?: string;
  branchId?: string;
  role?: string;
}

interface JwtPayload {
  userId?: string;
  companyId?: string;
  branchId?: string;
  role?: string;
  aud?: string;
  adminId?: string;
}

async function getDatabase(): Promise<Db> {
  return getMongoDb();
}

async function findOwnerRoleId(companyId: string): Promise<string | null> {
  const db = await getDatabase();
  const ownerRole = await db.collection<{ _id: string }>('roles').findOne(
    {
      company_id: companyId,
      name: 'Owner',
      is_deleted: { $ne: true },
    },
    { projection: { _id: 1 } },
  );
  return ownerRole?._id ?? null;
}

async function isOwner(userId: string, companyId: string): Promise<boolean> {
  const ownerRoleId = await findOwnerRoleId(companyId);
  if (!ownerRoleId) {
    return false;
  }

  const db = await getDatabase();
  return (
    (await db.collection('user_branch_roles').findOne({
      user_id: userId,
      role_id: ownerRoleId,
    })) !== null
  );
}

async function findRoleIdsForBranch(userId: string, branchId: string): Promise<string[]> {
  const db = await getDatabase();
  const roles = await db
    .collection<{ role_id: string }>('user_branch_roles')
    .find({ user_id: userId, branch_id: branchId })
    .project({ role_id: 1, _id: 0 })
    .toArray();

  return roles.map((role) => role.role_id);
}

async function findPermissionCodesForRoleIds(
  roleIds: string[],
  companyId: string,
): Promise<Set<string>> {
  if (roleIds.length === 0) {
    return new Set();
  }

  const db = await getDatabase();
  const rolePermissions = await db
    .collection<{ permission_id: string }>('role_permissions')
    .find({ role_id: { $in: roleIds } })
    .project({ permission_id: 1, _id: 0 })
    .toArray();

  const permissionIds = [...new Set(rolePermissions.map((rp) => rp.permission_id))];
  if (permissionIds.length === 0) {
    return new Set();
  }

  const permissions = await db
    .collection<{ code: string }>('permissions')
    .find({ _id: { $in: permissionIds }, company_id: companyId, is_deleted: { $ne: true } })
    .project({ code: 1, _id: 0 })
    .toArray();

  return new Set(permissions.map((permission) => permission.code));
}

async function resolvePermissions(
  userId: string,
  companyId: string,
  branchId: string,
): Promise<Set<string>> {
  if (await isOwner(userId, companyId)) {
    return new Set(['*']);
  }

  const roleIds = await findRoleIdsForBranch(userId, branchId);
  return findPermissionCodesForRoleIds(roleIds, companyId);
}

function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payloadJson) as JwtPayload;
}

export async function requirePermission(
  requiredCode: string,
): Promise<(request: AuthenticatedRequest) => Promise<void>> {
  return async (request: AuthenticatedRequest) => {
    if (!request.userId || !request.companyId || !request.branchId) {
      throw new UnauthorizedError('Missing authentication context');
    }

    const userPermissions = await resolvePermissions(
      request.userId,
      request.companyId,
      request.branchId,
    );

    if (!userPermissions.has('*') && !userPermissions.has(requiredCode)) {
      throw new ForbiddenError(`Permission denied. Required: ${requiredCode}`);
    }
  };
}

export async function requirePlatformAdmin(request: AuthenticatedRequest): Promise<void> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const token = authHeader.slice(7);
  let payload: JwtPayload;

  try {
    payload = decodeJwtPayload(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  if (payload.aud !== 'platform-admin') {
    throw new UnauthorizedError('PLATFORM_ADMIN_TOKEN_REJECTED');
  }

  if (!payload.adminId) {
    throw new UnauthorizedError('Invalid platform admin token payload');
  }
}

export function parseAccessToken(request: NextRequest): {
  userId: string;
  companyId: string;
  branchId: string;
  role: string;
} {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const token = authHeader.slice(7);
  let payload: JwtPayload;

  try {
    payload = decodeJwtPayload(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  if (!payload.userId || !payload.companyId) {
    throw new UnauthorizedError('Invalid token payload');
  }

  return {
    userId: payload.userId,
    companyId: payload.companyId,
    branchId: payload.branchId ?? '',
    role: payload.role ?? 'User',
  };
}
