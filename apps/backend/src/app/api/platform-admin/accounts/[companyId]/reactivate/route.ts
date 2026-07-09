import { NextRequest, NextResponse } from 'next/server';
import { ReactivateTenant } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../../lib/errors';
import { ReactivateSchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';
import { getMongoDb } from '../../../../../../lib/cloud-db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const adminById = async (_id: string): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  const adminDoc = await db.collection<Doc>('platform_admins').findOne({ is_active: true });
  if (!adminDoc) return null;
  return PlatformAdminUser.reconstitute({
    id: String(adminDoc._id),
    name: String(adminDoc.name ?? String(adminDoc.email).split('@')[0]),
    email: String(adminDoc.email),
    passwordHash: String(adminDoc.password_hash),
    role: adminDoc.role as import('@packages/domain-platform-admin').PlatformAdminRole,
    mfaSecret: adminDoc.mfa_secret ? String(adminDoc.mfa_secret) : null,
    isMfaEnrolled: Boolean(adminDoc.mfa_secret),
    isActive: Boolean(adminDoc.is_active),
    failedLoginAttempts: Number(adminDoc.failed_login_attempts ?? 0),
    lockedUntil: adminDoc.locked_until ? (adminDoc.locked_until as Date).toISOString() : null,
    createdAt: adminDoc.created_at instanceof Date ? adminDoc.created_at.toISOString() : new Date().toISOString(),
    updatedAt: adminDoc.updated_at instanceof Date ? adminDoc.updated_at.toISOString() : new Date().toISOString(),
  });
};

const getSubscriptionByCompanyId = async (companyId: string): Promise<Subscription | null> => {
  const db = await getMongoDb();
  const doc = await db.collection('subscriptions').findOne({ company_id: companyId });
  if (!doc) {
    return Subscription.reconstitute({
      id: `sub_${companyId}`,
      companyId,
      planId: null,
      status: 'trialing',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
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
  }
  return Subscription.reconstitute({
    id: doc._id.toString(),
    companyId: doc.company_id.toString(),
    planId: doc.plan_id || null,
    status: (doc.status === 'trial' ? 'trialing' : doc.status) as any,
    trialStartedAt: doc.trial_started_at?.toISOString() || new Date().toISOString(),
    trialEndsAt:
      doc.trial_ends_at?.toISOString() ||
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodStart: doc.activated_at?.toISOString() || null,
    currentPeriodEnd: doc.trial_ends_at?.toISOString() || null,
    lockedAt: doc.status === 'suspended' ? new Date().toISOString() : null,
    lockReason: doc.status === 'suspended' ? 'platform_admin_manual' : null,
    isFullAccessOverride: false,
    overrideExpiresAt: null,
    overrideReason: null,
    overrideGrantedByPlatformAdminId: null,
    createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
  });
};

const subscriptionRepo = {
  findByCompany: getSubscriptionByCompanyId,
  save: async (subscription: Subscription) => {
    const db = await getMongoDb();
    const snap = subscription as any;
    await db.collection('subscriptions').updateOne(
      { company_id: snap.companyId },
      {
        $set: {
          _id: snap.id,
          plan_id: snap.planId,
          status: snap.status === 'trialing' ? 'trial' : snap.status,
          trial_started_at: snap.trialStartedAt ? new Date(snap.trialStartedAt) : null,
          trial_ends_at: snap.trialEndsAt ? new Date(snap.trialEndsAt) : null,
          activated_at: snap.currentPeriodStart ? new Date(snap.currentPeriodStart) : null,
          suspended_at: snap.status === 'suspended' ? new Date() : null,
          updated_at: new Date(),
        },
      },
      { upsert: true },
    );
  },
};

const useCase = new ReactivateTenant(adminById, subscriptionRepo, async () => Promise.resolve());

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
): Promise<NextResponse> {
  const { companyId } = await context.params;
  try {
    const body = await request.json();
    const parsed = ReactivateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const db = await getMongoDb();
    const adminDoc = await db.collection('platform_admins').findOne({ is_active: true });
    const adminId = adminDoc?._id?.toString() || 'admin_demo';

    const result = await useCase.execute({
      companyId,
      reason: parsed.data.reason,
      adminId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: result.subscription.id,
            status:
              result.subscription.status === 'trial' ? 'trialing' : result.subscription.status,
            planId: result.subscription.planId,
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
