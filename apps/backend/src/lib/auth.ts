import { NextRequest } from 'next/server';
import { UnauthorizedError } from './errors';
import { t } from './i18n';

export interface AuthContext {
  userId: string;
  companyId: string;
  branchRoles: string[];
}

export function getAuthContext(request: NextRequest): AuthContext {
  const authHeader = request.headers.get('authorization');
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  if (!token) {
    throw new UnauthorizedError(t('auth.missingToken', undefined, request));
  }

  if (!token.startsWith('ey')) {
    throw new UnauthorizedError(t('auth.invalidToken', undefined, request));
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError(t('auth.invalidToken', undefined, request));
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as AuthContext;
    return payload;
  } catch {
    throw new UnauthorizedError(t('auth.invalidToken', undefined, request));
  }
}
