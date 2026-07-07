import { NextRequest, NextResponse } from 'next/server';
import { ExtendTrial } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../../../lib/errors';
import { ExtendTrialSchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

const adminById = async (_id: string): Promise<PlatformAdminUser | null> =>
  PlatformAdminUser.create({
    name: 'Demo Admin',
    email: 'admin@smartretail.local',
    passwordHash: 'hashed-password',
    role: 'super_admin',
    mfaSecret: 'JBSWY3DPEBLW64TMMQ======',
    isMfaEnrolled: true,
    isActive: true,
  });

const subscriptionByCompanyId = async (): Promise<Subscription | null> => {
  return Subscription.reconstitute({
    id: 'sub_demo',
    companyId: 'company_demo',
    planId: null,
    status: 'trialing',
    trialStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    trialEndsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodStart: null,
    currentPeriodEnd: null,
    lockedAt: null,
    lockReason: null,
    isFullAccessOverride: false,
    overrideExpiresAt: null,
    overrideReason: null,
    overrideGrantedByPlatformAdminId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

const subscriptionRepo = {
  findByCompany: subscriptionByCompanyId,
  save: async (_subscription: Subscription) => {},
};

const useCase = new ExtendTrial(adminById, subscriptionRepo, async () => Promise.resolve());

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
): Promise<NextResponse> {
  const { companyId } = await context.params;
  try {
    const body = await request.json();
    const parsed = ExtendTrialSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute({
      companyId,
      newTrialEndsAt: parsed.data.newTrialEndsAt,
      reason: parsed.data.reason,
      adminId: 'admin_demo',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: result.subscription.id,
            status: result.subscription.status,
            trialEndsAt: result.subscription.trialEndsAt,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
