import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../lib/auth';
import { getActorId } from '../../../../lib/purchasing-permissions';
import { handleApiError } from '../../../../lib/errors';
import { MongoNotificationRepository } from '@packages/infrastructure-mongodb';
import { serializeNotification } from './serialize';

/**
 * GET /api/v1/notifications
 * Paginated, unread-first list for the current user. Supports ?isRead= and
 * ?category= filters.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const url = new URL(request.url);
    const isReadParam = url.searchParams.get('isRead');
    const category = url.searchParams.get('category') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '50');

    const repo = new MongoNotificationRepository();
    const notifications = await repo.findByQuery({
      companyId,
      recipientUserId: userId,
      isRead: isReadParam === null ? undefined : isReadParam === 'true',
      category: category as never,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: notifications.map((n) => serializeNotification(n, request)),
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
