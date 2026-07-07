import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '../../../lib/errors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Demo response — reads from companies/subscriptions collection
    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: 'sub_demo',
            status: 'trialing',
            planId: null,
            trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            trialStartedAt: new Date().toISOString(),
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { planId, billingCycle } = body as { planId?: string; billingCycle?: string };

    if (!planId || !billingCycle) {
      throw new ValidationError('planId and billingCycle are required');
    }

    if (!['basic', 'pro', 'enterprise'].includes(planId)) {
      throw new ValidationError('planId must be one of: basic, pro, enterprise');
    }

    // Demo response — activate subscription
    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: {
            id: 'sub_demo',
            status: 'active',
            planId,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
