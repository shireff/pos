import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, UnauthorizedError } from '../../../../lib/errors';

export const usedRefreshTokens = new Set<string>();

export function resetRefreshTokenStore(): void {
  usedRefreshTokens.clear();
}

export function createRefreshRouteHandler(store: Set<string> = usedRefreshTokens) {
  const tokenIssuer = new DemoTokenIssuer();

  return async function POST(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { refreshToken } = body as { refreshToken?: string };

      if (!refreshToken) {
        throw new ValidationError('refreshToken is required');
      }

      if (refreshToken !== 'refresh-token') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (store.has(refreshToken)) {
        throw new UnauthorizedError('Refresh token has already been used');
      }

      store.add(refreshToken);

      const accessToken = tokenIssuer.issueAccessToken({
        userId: 'demo-user',
        companyId: 'company-demo',
        branchRoles: [],
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            accessToken,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

class DemoTokenIssuer {
  public issueAccessToken(payload: {
    userId: string;
    companyId: string;
    branchRoles: string[];
  }): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString('base64url');
    return `${header}.${body}.signature`;
  }

  public issueRefreshToken(): string {
    return 'refresh-token';
  }

  public hashToken(token: string): string {
    return token;
  }

  public verifyAccessToken(
    token: string,
  ): { userId: string; companyId: string; branchRoles: string[] } | null {
    if (!token.startsWith('ey')) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        userId: string;
        companyId: string;
        branchRoles: string[];
      };
      return payload;
    } catch {
      return null;
    }
  }
}
