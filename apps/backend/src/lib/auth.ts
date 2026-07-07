import { NextRequest } from 'next/server';
import { UnauthorizedError } from './errors';

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
    throw new UnauthorizedError('Missing bearer token');
  }

  if (!token.startsWith('ey')) {
    throw new UnauthorizedError('Invalid access token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Invalid access token');
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as AuthContext;
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid access token');
  }
}
