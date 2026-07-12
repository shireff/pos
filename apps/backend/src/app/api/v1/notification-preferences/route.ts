import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../lib/auth';
import { getActorId } from '../../../../lib/purchasing-permissions';
import { handleApiError } from '../../../../lib/errors';
import { MongoNotificationPreferenceRepository } from '@packages/infrastructure-mongodb';
import type { NotificationCategory, NotificationChannel, NotificationFrequency } from '@packages/domain-notifications';

const CATEGORIES: NotificationCategory[] = [
  'INVENTORY',
  'APPROVALS',
  'SYNC',
  'AI_INSIGHTS',
  'BILLING_TRIAL',
  'REPORTS',
  'SECURITY',
  'GENERAL',
];
const CHANNELS: NotificationChannel[] = ['IN_APP', 'PUSH', 'EMAIL'];
const FREQUENCIES: NotificationFrequency[] = ['IMMEDIATE', 'HOURLY_DIGEST', 'DAILY_DIGEST'];

function asEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : null;
}

/**
 * GET /api/v1/notification-preferences — current user's preferences.
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

    const repo = new MongoNotificationPreferenceRepository();
    const prefs = await repo.getAllForUser(userId, companyId);
    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

/**
 * PUT /api/v1/notification-preferences — update the current user's preferences.
 * Body: array of { category, channel, frequency, isEnabled }.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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

    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Expected an array of preferences.' } },
        { status: 400 },
      );
    }

    const repo = new MongoNotificationPreferenceRepository();
    const saved: unknown[] = [];
    for (const item of body) {
      const category = asEnum<NotificationCategory>(item?.category, CATEGORIES);
      const channel = asEnum<NotificationChannel>(item?.channel, CHANNELS);
      const frequency = asEnum<NotificationFrequency>(item?.frequency, FREQUENCIES);
      if (!category || !channel || !frequency) continue;
      const row = {
        userId,
        companyId,
        category,
        channel,
        frequency,
        isEnabled: Boolean(item?.isEnabled),
      };
      await repo.upsert(row);
      saved.push(row);
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
