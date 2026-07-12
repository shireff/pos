import type { NotificationCategory } from '@packages/domain-notifications';
import type { RateLimitRepositoryPort, RateLimitWindow } from './ports';

export interface RateLimiterConfig {
  /** Max notifications per (user, category) per day before folding into a summary. */
  dailyCap: number;
  /** Sliding-window duplicate suppression: ignore identical keys within this window (ms). */
  duplicateWindowMs: number;
  /** Length of the rolling daily window (ms). */
  windowMs: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimiterConfig = {
  dailyCap: 20,
  duplicateWindowMs: 10 * 60 * 1000, // 10 minutes
  windowMs: 24 * 60 * 60 * 1000, // 1 day
};

export interface RateLimitResult {
  /** True when the notification may be delivered. */
  allowed: boolean;
  /** True when this exact (user, category, key) was seen within the duplicate window. */
  duplicate: boolean;
  /** True when the daily cap for the category is already reached. */
  capReached: boolean;
  window: RateLimitWindow;
}

/**
 * Per-category daily cap + sliding-window duplicate suppression.
 *
 * - A duplicate (same key within `duplicateWindowMs`) is suppressed.
 * - Once the daily cap is reached, further notifications are folded into a single
 *   "N more <category> alerts today" summary (the caller is responsible for that
 *   summary; this returns capReached=true so it can decide).
 * - The Billing & Trial category is exempt (BR-NOT-004): callers must bypass.
 */
export class RateLimiter {
  constructor(
    private readonly repo: RateLimitRepositoryPort,
    private readonly config: RateLimiterConfig = DEFAULT_RATE_LIMIT_CONFIG,
  ) {}

  public async evaluate(
    userId: string,
    category: NotificationCategory,
    key: string,
    now: Date,
  ): Promise<RateLimitResult> {
    const existing = await this.repo.getWindow(userId, category, now);

    const isDuplicate =
      !!existing &&
      existing.lastKey === key &&
      now.getTime() - existing.lastKeyAt.getTime() < this.config.duplicateWindowMs;

    if (isDuplicate) {
      // Touch the window so the duplicate still counts toward activity.
      const touched = await this.repo.increment(userId, category, now, key, this.config.windowMs, now);
      return { allowed: false, duplicate: true, capReached: false, window: touched };
    }

    const count = existing?.count ?? 0;
    const capReached = count >= this.config.dailyCap;

    const updated = await this.repo.increment(userId, category, now, key, this.config.windowMs, now);

    return {
      allowed: !capReached,
      duplicate: false,
      capReached,
      window: updated,
    };
  }
}
