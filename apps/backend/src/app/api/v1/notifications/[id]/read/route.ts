import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../../../lib/auth';
import { getActorId } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, NotFoundError } from '../../../../../../lib/errors';
import { MongoNotificationRepository } from '@packages/infrastructure-mongodb';

/**
 * POST /api/v1/notifications/:id/read — mark a single notification as read.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
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
    const existing = await repo.findById(id);
    if (!existing || existing.recipientUserId !== userId || existing.companyId !== companyId) {
      throw new NotFoundError('Notification', id);
    }
    await repo.markRead(id);

    return NextResponse.json({ success: true, data: { id, isRead: true } });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
