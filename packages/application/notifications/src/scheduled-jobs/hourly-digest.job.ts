import { systemClock } from '../ports';
import type { DigestJobDeps } from './digest-job-deps';
import { batchDigestForUser } from '../digest-batcher';

const HOURLY_MS = 60 * 60 * 1000;

/**
 * Hourly digest job — aggregates MEDIUM-priority notifications per user into a
 * single hourly digest (Notifications.md §9, TESTS.md priority.test).
 */
export async function runHourlyDigest(deps: DigestJobDeps): Promise<number> {
  const clock = deps.clock ?? systemClock;
  const now = clock.now();
  const since = new Date(now.getTime() - HOURLY_MS);
  const recipients = await deps.notificationRepo.findPendingDigestRecipients('MEDIUM', since);
  let created = 0;
  for (const { companyId, recipientUserId } of recipients) {
    const pending = await deps.notificationRepo.findPendingDigest(
      companyId,
      recipientUserId,
      'MEDIUM',
      since,
    );
    const result = await batchDigestForUser(
      { notificationRepo: deps.notificationRepo, digestRepo: deps.digestRepo, clock },
      companyId,
      recipientUserId,
      'HOURLY',
      pending,
    );
    created += result.created;
  }
  return created;
}
