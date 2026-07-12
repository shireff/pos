import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

export async function assertTaxPermission(request: NextRequest, requiredPermission: string): Promise<void> {
  const ctx = getAuthContext(request);
  const permissions = new Set<string>(ctx.branchRoles ?? []);
  if (permissions.has(requiredPermission)) return;

  const header = request.headers.get('x-user-permissions') ?? '';
  const headerPerms = new Set(header.split(',').map((c) => c.trim()).filter(Boolean));
  if (headerPerms.has(requiredPermission)) return;

  throw new ForbiddenError(requiredPermission);
}
