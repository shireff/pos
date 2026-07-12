import { NextRequest } from 'next/server';
import { ForbiddenError } from './errors';
import { getAuthContext } from './auth';

export function assertAiAssistantPermission(request: NextRequest): void {
  assertPermission(request, 'ai.assistant');
}

export function assertAiViewPermission(request: NextRequest): void {
  assertPermission(request, 'ai.view');
}

function assertPermission(request: NextRequest, requiredPermission: string): void {
  try {
    const ctx = getAuthContext(request);
    const permissions = new Set<string>(ctx.branchRoles ?? []);
    if (permissions.has(requiredPermission)) return;
  } catch {
    // ignore auth context errors, fall through to header check
  }

  const header = request.headers.get('x-user-permissions') ?? '';
  const headerPerms = new Set(header.split(',').map((c) => c.trim()).filter(Boolean));
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
    // ignore
  }
  return 'system';
}

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
