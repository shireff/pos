import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

/**
 * Asserts that the authenticated user has the required catalog permission.
 *
 * Permission source (in priority order):
 *  1. JWT `branchRoles` claim — populated at login with all permission codes
 *     from the user's role assignments.
 *  2. `x-user-permissions` header — legacy / service-to-service calls.
 */
export async function assertCatalogPermission(
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
      const error = new ForbiddenError(requiredPermission);
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
    throw new ForbiddenError(requiredPermission);
  }
}
