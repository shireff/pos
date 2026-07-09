import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

/**
 * Asserts that the authenticated user has the required purchasing permission.
 * Permission codes: purchasing.view, purchasing.create, purchasing.edit,
 * purchasing.approve, purchasing.receive, purchasing.invoice.record.
 */
export async function assertPurchasingPermission(
  request: NextRequest,
  requiredPermission: string,
): Promise<void> {
  // Try JWT first
  try {
    const ctx = getAuthContext(request);
    // branchRoles field holds permission codes (populated at login)
    const permissions = new Set<string>(ctx.branchRoles ?? []);
    if (permissions.has(requiredPermission)) return;
    // Fall through to header check if JWT has no permissions (backwards compat)
    if (ctx.branchRoles && ctx.branchRoles.length > 0) {
      const error = new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
      (error as ForbiddenError & { permissionCode?: string }).permissionCode = requiredPermission;
      throw error;
    }
  } catch (e) {
    // If it's a ForbiddenError we already decided — re-throw
    if (e instanceof ForbiddenError) throw e;
    // Otherwise JWT missing/invalid — fall through to header check
  }

  // Fallback: x-user-permissions header (legacy support)
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

/**
 * Best-effort extraction of the acting user id from the auth context.
 * Falls back to a system placeholder when no JWT is present (e.g. in tests).
 */
export function getActorId(request: NextRequest): string {
  try {
    const ctx = getAuthContext(request);
    if (ctx.userId) return ctx.userId;
  } catch {
    // ignore — no auth context available
  }
  return 'system';
}
