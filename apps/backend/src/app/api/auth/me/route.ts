import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../lib/auth';
import { handleApiError } from '../../../../lib/errors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = getAuthContext(request);

    return NextResponse.json({
      success: true,
      data: {
        userId: context.userId,
        companyId: context.companyId,
        branchRoles: context.branchRoles,
      },
    });
  } catch (error) {
    return handleApiError(error, request);
  }
}
