import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../../lib/auth';
import { getActorId } from '../../../../../lib/purchasing-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { MongoNotificationRepository } from '@packages/infrastructure-mongodb';

/**
 * POST /api/v1/notifications/read-all — mark all of the current user's
 * notifications as read.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let companyId = 'company-1';
    let userId = getActorId(request);
    try {
      const ctx = getAuthContext(request);
      companyId = ctx.companyId ?? companyId;
      userId = ctx.userId ?? userId;
    } catch {
      // fall back to defaults when no auth context
    }

    const repo = new MongoNotificationRepository();
    await repo.markAllRead(companyId, userId);

    return NextResponse.json({ success: true, data: { markedRead: true } });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
