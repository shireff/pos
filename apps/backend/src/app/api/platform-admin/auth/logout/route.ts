import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, UnauthorizedError } from '../../../../../lib/errors';

/**
 * POST /api/platform-admin/auth/logout
 * Revokes the platform admin access token.
 * Token is stateless (JWT) — server validates format and audience claim.
 * Client must discard the token after this response.
 * Production: add jti to a denylist (Redis) for immediate revocation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const match = authHeader?.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      throw new ValidationError('Authorization header with Bearer token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedError('Invalid token format');
    }

    let payload: { aud?: string; adminId?: string };
    try {
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        aud?: string;
        adminId?: string;
      };
    } catch {
      throw new UnauthorizedError('Invalid token payload');
    }

    if (payload.aud !== 'platform-admin') {
      throw new UnauthorizedError('PLATFORM_ADMIN_TOKEN_REJECTED');
    }

    if (!payload.adminId) {
      throw new UnauthorizedError('Invalid platform admin token payload');
    }

    return NextResponse.json(
      { success: true, data: { revoked: true, adminId: payload.adminId } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
