import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, UnauthorizedError } from '../../../../lib/errors';
import { usedRefreshTokens } from '../refresh/store';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { refreshToken } = body as { refreshToken?: string };

    if (!refreshToken) {
      throw new ValidationError('refreshToken is required');
    }

    if (refreshToken !== 'refresh-token') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    usedRefreshTokens.add(refreshToken);

    return NextResponse.json(
      {
        success: true,
        data: {
          revoked: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
