import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '../../../../../lib/errors';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
): Promise<NextResponse> {
  try {
    const { companyId } = await context.params;

    if (!companyId?.trim()) {
      throw new ValidationError('companyId is required');
    }

    // Demo response — reads company account details
    return NextResponse.json(
      {
        success: true,
        data: {
          account: {
            companyId,
            name: 'Demo Company',
            businessType: 'retail',
            subscription: {
              status: 'active',
              planId: 'pro',
              trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
