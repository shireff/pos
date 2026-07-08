import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';

export async function assertCatalogPermission(
  request: NextRequest,
  requiredPermission: string,
): Promise<void> {
  const header = request.headers.get('x-user-permissions') ?? '';
  const permissions = new Set(
    header
      .split(',')
      .map((code) => code.trim())
      .filter(Boolean),
  );

  if (!permissions.has(requiredPermission)) {
    const error = new ForbiddenError(`Permission denied. Required: ${requiredPermission}`);
    (error as ForbiddenError & { permissionCode?: string }).permissionCode = requiredPermission;
    throw error;
  }
}
