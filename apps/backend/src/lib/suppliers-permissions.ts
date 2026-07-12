import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

export async function assertSuppliersPermission(
  request: NextRequest,
  requiredPermission: string,
): Promise<void> {
  try {
    const ctx = getAuthContext(request);
    const permissions = new Set<string>(ctx.branchRoles ?? []);
    if (permissions.has(requiredPermission)) return;
    if (ctx.branchRoles && ctx.branchRoles.length > 0) {
      throw new ForbiddenError(requiredPermission);
    }
  } catch (e) {
    if (e instanceof ForbiddenError) throw e;
  }

  const header = request.headers.get('x-user-permissions') ?? '';
  const headerPerms = new Set(
    header.split(',').map((c) => c.trim()).filter(Boolean),
  );

  if (!headerPerms.has(requiredPermission)) {
    const error = new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
    (error as ForbiddenError & { permissionCode?: string }).permissionCode = requiredPermission;
    throw error;
  }
}

export function getActorId(request: NextRequest): string {
  try {
    const ctx = getAuthContext(request);
    if (ctx.userId) return ctx.userId;
  } catch {
    // ignore — no auth context available
  }
  return 'system';
}
