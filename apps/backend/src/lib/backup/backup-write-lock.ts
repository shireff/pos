import { NextRequest } from 'next/server';
import { Db } from 'mongodb';
import { Subscription, type SubscriptionStatus, type LockReason } from '@packages/domain-billing';
import { SubscriptionWriteLockGuard } from '@packages/domain-billing';
import { getAuthContext } from '../auth';
import { ForbiddenError } from '../errors';
import { t } from '../i18n';

interface SubscriptionDoc {
  _id: string;
  company_id: string;
  plan_id?: string | null;
  status: SubscriptionStatus;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  locked_at?: string | null;
  lock_reason?: string | null;
  is_full_access_override?: boolean;
  override_expires_at?: string | null;
  override_reason?: string | null;
  override_granted_by_platform_admin_id?: string | null;
  activated_at?: string | null;
  suspended_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data-safety carve-out: backup creation and restore remain available even when
 * the account is trial_expired or suspended. Every other state-changing command
 * is rejected with a localized FORBIDDEN error when the subscription is locked.
 *
 * Uses SubscriptionWriteLockGuard.ensureWritableFor, which bypasses the lock for
 * the registered backup command types (BR-BAK-004, Security.md §8).
 */
export async function assertBackupCommandAllowed(
  db: Db,
  request: NextRequest,
  commandType: 'CreateBackupCommand' | 'RestoreBackupCommand' | string,
): Promise<void> {
  const ctx = getAuthContext(request);
  const found = await db.collection('subscriptions').findOne({ company_id: ctx.companyId });
  if (!found) return; // No subscription document → not locked.

  const doc = found as unknown as SubscriptionDoc;

  const subscription = Subscription.reconstitute({
    id: doc._id,
    companyId: ctx.companyId,
    planId: doc.plan_id ?? null,
    status: doc.status,
    trialStartedAt: doc.trial_started_at ?? null,
    trialEndsAt: doc.trial_ends_at ?? null,
    currentPeriodStart: doc.current_period_start ?? null,
    currentPeriodEnd: doc.current_period_end ?? null,
    lockedAt: doc.locked_at ?? null,
    lockReason: (doc.lock_reason ?? null) as LockReason | null,
    isFullAccessOverride: doc.is_full_access_override ?? false,
    overrideExpiresAt: doc.override_expires_at ?? null,
    overrideReason: doc.override_reason ?? null,
    overrideGrantedByPlatformAdminId: doc.override_granted_by_platform_admin_id ?? null,
    activatedAt: doc.activated_at ?? null,
    suspendedAt: doc.suspended_at ?? null,
    createdAt: doc.created_at ?? new Date().toISOString(),
    updatedAt: doc.updated_at ?? new Date().toISOString(),
  });

  try {
    SubscriptionWriteLockGuard.ensureWritableFor(commandType, subscription);
  } catch {
    const suspended = subscription.status === 'suspended';
    throw new ForbiddenError(
      suspended ? 'ACCOUNT_SUSPENDED' : 'TRIAL_EXPIRED',
      suspended ? t('lock.accountSuspended', undefined, request) : t('lock.trialExpired', undefined, request),
    );
  }
}
