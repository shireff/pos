import type { Notification } from '@packages/domain-notifications';
import { Identifier } from '@packages/shared-kernel';
import type {
  DigestRepositoryPort,
  NotificationCategory,
  NotificationRepositoryPort,
} from './ports';

/**
 * Digest batcher (Notifications.md §9, TESTS.md priority.test).
 *
 * Aggregates MEDIUM-priority notifications into an hourly digest and LOW-priority
 * notifications into a daily digest. Each digest groups its members by category,
 * shows the per-group count, and links to the full list. CRITICAL/HIGH are never
 * batched (enforced by the priority gate before this is reached).
 */
export interface DigestBatchResult {
  frequency: 'HOURLY' | 'DAILY';
  created: number;
}

export interface DigestBatcherDeps {
  notificationRepo: NotificationRepositoryPort;
  digestRepo: DigestRepositoryPort;
  clock?: { now(): Date };
}

export async function batchDigestForUser(
  deps: DigestBatcherDeps,
  companyId: string,
  userId: string,
  frequency: 'HOURLY' | 'DAILY',
  pending: Notification[],
): Promise<DigestBatchResult> {
  if (pending.length === 0) {
    return { frequency, created: 0 };
  }

  const categoryCounts: Record<string, number> = {};
  const notificationIds: string[] = [];
  for (const n of pending) {
    const cat = n.category as NotificationCategory;
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    notificationIds.push(n.id);
  }

  const now = deps.clock ? deps.clock.now() : new Date();
  const periodStart = new Date(pending[0].createdAt.getTime());
  const digest = {
    id: Identifier.generate(),
    companyId,
    recipientUserId: userId,
    frequency,
    categoryCounts,
    notificationIds,
    titleKey:
      frequency === 'HOURLY' ? 'notifications.digest.hourlyTitle' : 'notifications.digest.dailyTitle',
    bodyKey:
      frequency === 'HOURLY' ? 'notifications.digest.hourlyBody' : 'notifications.digest.dailyBody',
    vars: { count: notificationIds.length },
    actionUrl: '/notifications',
    isRead: false,
    periodStart,
    periodEnd: now,
    createdAt: now,
  };

  await deps.digestRepo.save(digest);
  await deps.notificationRepo.markDigested(notificationIds);
  return { frequency, created: 1 };
}
