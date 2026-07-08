import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { getMongoDb } from '../../../../../lib/cloud-db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
): Promise<NextResponse> {
  try {
    const { companyId } = await context.params;

    if (!companyId?.trim()) {
      throw new ValidationError('companyId is required');
    }

    const db = await getMongoDb();
    const company = await db.collection<any>('companies').findOne({ _id: companyId });

    if (!company) {
      throw new ValidationError(`Company with ID "${companyId}" not found`);
    }

    const sub = await db.collection<any>('subscriptions').findOne({ company_id: companyId });

    return NextResponse.json(
      {
        success: true,
        data: {
          account: {
            companyId: company._id.toString(),
            name: company.name,
            businessType: company.business_type || 'retail',
            subscription: {
              status: sub?.status === 'trial' ? 'trialing' : sub?.status || 'trialing',
              planId: sub?.plan_id || null,
              trialEndsAt:
                sub?.trial_ends_at?.toISOString() ||
                new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            createdAt: company.created_at?.toISOString() || new Date().toISOString(),
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
