import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from '../lib/auth';

export async function assertInventoryPermission(
  request: NextRequest,
  requiredPermission: string,
): Promise<void> {
  try {
    const ctx = getAuthContext(request);
    const permissions = new Set<string>(ctx.branchRoles ?? []);
    if (permissions.has(requiredPermission)) return;
    if (permissions.has('*')) return;
    const error = new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
    (error as ForbiddenError & { permissionCode?: string }).permissionCode = requiredPermission;
    throw error;
  } catch (e) {
    if (e instanceof ForbiddenError) throw e;
    throw new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
  }
}
