import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

/**
 * Asserts that the authenticated user has the required sales permission.
 * Permission codes: sales.create, sales.view, sales.void, sales.return.create,
 * sales.refund.approve, sales.cash_drawer.open_no_sale, sales.shift.open_close,
 * sales.shift.reconciliation.view.
 */
export async function assertSalesPermission(
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
  const headerPerms = new Set(header.split(',').map((c) => c.trim()).filter(Boolean));
  if (!headerPerms.has(requiredPermission)) {
    const error = new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
    (error as ForbiddenError & { permissionCode?: string }).permissionCode = requiredPermission;
    throw error;
  }
}

/** Best-effort extraction of the acting user id from the auth context. */
export function getActorId(request: NextRequest): string {
  try {
    const ctx = getAuthContext(request);
    if (ctx.userId) return ctx.userId;
  } catch {
    // ignore
  }
  return 'system';
}

/** Extracts the company id from auth context, falling back to a header/body default. */
export function getCompanyId(request: NextRequest, fallback = 'company-1'): string {
  try {
    const ctx = getAuthContext(request);
    if (ctx.companyId) return ctx.companyId;
  } catch {
    // ignore
  }
  const header = request.headers.get('x-company-id');
  return header ?? fallback;
}
