import {
  NotificationPriority,
  type NotificationCategory,
  type NotificationPriorityLevel,
} from '@packages/domain-notifications';

/**
 * Priority gate (Notifications.md §4).
 *
 * Determines, based purely on priority + category, how a notification is routed:
 *  - CRITICAL: bypass rate limit AND digest, deliver immediately + individually
 *  - HIGH: never batched, immediate (but counts toward the rate limit)
 *  - MEDIUM: eligible for hourly digest
 *  - LOW: daily digest only
 *
 * BILLING_TRIAL is exempt from the daily cap (BR-NOT-004).
 */
export interface RoutingDecision {
  bypassesRateLimit: boolean;
  /** When true the notification is delivered immediately (no digest batching). */
  immediate: boolean;
  /** MEDIUM → 'HOURLY', LOW → 'DAILY', else null (immediate). */
  digestFrequency: 'HOURLY' | 'DAILY' | null;
}

export function decideRouting(
  priority: NotificationPriorityLevel,
  category: NotificationCategory,
): RoutingDecision {
  const vo = NotificationPriority.from(priority);

  // BILLING_TRIAL is exempt from the daily cap at any priority (BR-NOT-004):
  // the rate limiter is always bypassed for that category.
  const bypassesRateLimit = vo.bypassesRateLimit(category);

  if (vo.isCritical) {
    return { bypassesRateLimit: true, immediate: true, digestFrequency: null };
  }

  if (vo.isHigh) {
    return {
      bypassesRateLimit,
      immediate: true,
      digestFrequency: null,
    };
  }

  if (vo.isMedium) {
    return { bypassesRateLimit, immediate: false, digestFrequency: 'HOURLY' };
  }

  // LOW
  return { bypassesRateLimit, immediate: false, digestFrequency: 'DAILY' };
}

/** A notification is never batched when it is CRITICAL or HIGH. */
export function isNeverBatched(
  priority: NotificationPriorityLevel,
  _category: NotificationCategory,
): boolean {
  const vo = NotificationPriority.from(priority);
  return vo.isCritical || vo.isHigh;
}

/** Billing & Trial can never be summarized/rate-limited away (BR-NOT-004). */
export function isExemptFromCap(category: NotificationCategory): boolean {
  return category === 'BILLING_TRIAL';
}
