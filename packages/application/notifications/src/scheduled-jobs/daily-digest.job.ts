import { systemClock } from '../ports';
import type { DigestJobDeps } from './digest-job-deps';
import { batchDigestForUser } from '../digest-batcher';

const DAILY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily digest job — aggregates LOW-priority notifications per user into a
 * single daily digest (Notifications.md §9).
 */
export async function runDailyDigest(deps: DigestJobDeps): Promise<number> {
  const clock = deps.clock ?? systemClock;
  const now = clock.now();
  const since = new Date(now.getTime() - DAILY_MS);
  const recipients = await deps.notificationRepo.findPendingDigestRecipients('LOW', since);
  let created = 0;
  for (const { companyId, recipientUserId } of recipients) {
    const pending = await deps.notificationRepo.findPendingDigest(
      companyId,
      recipientUserId,
      'LOW',
      since,
    );
    const result = await batchDigestForUser(
      { notificationRepo: deps.notificationRepo, digestRepo: deps.digestRepo, clock },
      companyId,
      recipientUserId,
      'DAILY',
      pending,
    );
    created += result.created;
  }
  return created;
}
