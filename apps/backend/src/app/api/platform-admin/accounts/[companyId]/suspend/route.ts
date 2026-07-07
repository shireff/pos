import { NextRequest, NextResponse } from 'next/server';
import { SuspendTenant } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../../lib/errors';
import { SuspendSchema } from '@packages/shared-kernel';
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
    planId: 'pro',
    status: 'active',
    trialStartedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    trialEndsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
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

const useCase = new SuspendTenant(adminById, subscriptionRepo, async () => Promise.resolve());

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
): Promise<NextResponse> {
  const { companyId } = await context.params;
  try {
    const body = await request.json();
    const parsed = SuspendSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute({
      companyId,
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
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
