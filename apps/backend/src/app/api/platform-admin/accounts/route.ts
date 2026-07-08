import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../lib/errors';
import { getMongoDb } from '../../../../lib/cloud-db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = await getMongoDb();
    const companies = await db
      .collection<any>('companies')
      .find({ is_deleted: { $ne: true } })
      .toArray();

    const accounts = await Promise.all(
      companies.map(async (company) => {
        const sub = await db.collection<any>('subscriptions').findOne({ company_id: company._id });
        return {
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
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        accounts,
      },
    });
  } catch (error) {
    return handleApiError(error, request);
  }
}
