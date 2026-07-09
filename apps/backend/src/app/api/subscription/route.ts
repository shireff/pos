import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '../../../lib/errors';
import { getAuthContext } from '../../../lib/auth';
import { getMongoDb } from '../../../lib/cloud-db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    const companyId = authContext.companyId;

    const db = await getMongoDb();
    const doc = await db.collection<any>('subscriptions').findOne({ company_id: companyId });

    if (!doc) {
      // Create a default trial subscription on-the-fly
      // plan_id intentionally omitted — schema bsonType is 'string' (not nullable)
      const now = new Date();
      const defaultSub: Record<string, unknown> = {
        _id: `sub_${companyId}`,
        company_id: companyId,
        status: 'trialing',
        trial_started_at: now,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now,
      };
      await db.collection<any>('subscriptions').insertOne(defaultSub);

      return NextResponse.json({
        success: true,
        data: {
          subscription: {
            id: defaultSub._id,
            status: 'trialing',
            planId: null,
            trialEndsAt: (defaultSub.trial_ends_at as Date).toISOString(),
            trialStartedAt: (defaultSub.trial_started_at as Date).toISOString(),
            isWriteLocked: false,
            isFullAccessOverride: false,
          },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: doc._id.toString(),
            status: doc.status === 'trial' ? 'trialing' : doc.status,
            planId: doc.plan_id || null,
            trialEndsAt:
              doc.trial_ends_at?.toISOString() ||
              new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            trialStartedAt: doc.trial_started_at?.toISOString() || new Date().toISOString(),
            isWriteLocked: doc.status === 'suspended',
            isFullAccessOverride: false,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    const companyId = authContext.companyId;

    const body = await request.json();
    const { planId } = body as { planId?: string };

    if (!planId) {
      throw new ValidationError('planId is required');
    }

    if (!['basic', 'pro', 'enterprise'].includes(planId)) {
      throw new ValidationError('planId must be one of: basic, pro, enterprise');
    }

    const db = await getMongoDb();

    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Check if subscription exists — use upsert carefully to avoid null plan_id schema violation
    const existing = await db.collection<any>('subscriptions').findOne({ company_id: companyId });

    if (existing) {
      await db.collection<any>('subscriptions').updateOne(
        { company_id: companyId },
        { $set: { plan_id: planId, status: 'active', trial_ends_at: trialEndsAt, updated_at: new Date() } },
      );
    } else {
      const now = new Date();
      await db.collection<any>('subscriptions').insertOne({
        _id: `sub_${companyId}`,
        company_id: companyId,
        status: 'active',
        plan_id: planId,
        trial_started_at: now,
        trial_ends_at: trialEndsAt,
        created_at: now,
        updated_at: now,
      });
    }

    const doc = await db.collection<any>('subscriptions').findOne({ company_id: companyId });

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: doc?._id?.toString() || `sub_${companyId}`,
            status: 'active',
            planId: planId,
            trialEndsAt: trialEndsAt.toISOString(),
            isWriteLocked: false,
            isFullAccessOverride: false,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
