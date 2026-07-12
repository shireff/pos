import {
  NotificationCategory,
  NotificationFrequency,
  NotificationPriorityLevel,
} from '../types';

/**
 * Priority value object for notifications.
 *
 * Encapsulates the priority-based behavior rules from Notifications.md §4:
 *  - CRITICAL: never batched, always sent immediately + individually
 *  - HIGH: never batched, immediate
 *  - MEDIUM: eligible for hourly digest
 *  - LOW: daily digest only
 */
export class NotificationPriority {
  private constructor(public readonly level: NotificationPriorityLevel) {}

  public static readonly CRITICAL = new NotificationPriority('CRITICAL');
  public static readonly HIGH = new NotificationPriority('HIGH');
  public static readonly MEDIUM = new NotificationPriority('MEDIUM');
  public static readonly LOW = new NotificationPriority('LOW');

  public static from(level: NotificationPriorityLevel): NotificationPriority {
    switch (level) {
      case 'CRITICAL':
        return NotificationPriority.CRITICAL;
      case 'HIGH':
        return NotificationPriority.HIGH;
      case 'MEDIUM':
        return NotificationPriority.MEDIUM;
      case 'LOW':
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  public get isCritical(): boolean {
    return this.level === 'CRITICAL';
  }

  public get isHigh(): boolean {
    return this.level === 'HIGH';
  }

  public get isMedium(): boolean {
    return this.level === 'MEDIUM';
  }

  public get isLow(): boolean {
    return this.level === 'LOW';
  }

  /**
   * CRITICAL notifications bypass both rate limiting and digesting.
   * BILLING_TRIAL category is also exempt from the daily cap (BR-NOT-004).
   */
  public bypassesRateLimit(category: NotificationCategory): boolean {
    return this.isCritical || category === 'BILLING_TRIAL';
  }

  /** Only CRITICAL and HIGH are delivered immediately (never batched). */
  public get isImmediate(): boolean {
    return this.isCritical || this.isHigh;
  }

  /** MEDIUM batches into the hourly digest. */
  public get isHourlyDigestible(): boolean {
    return this.isMedium;
  }

  /** LOW batches into the daily digest. */
  public get isDailyDigestible(): boolean {
    return this.isLow;
  }

  /**
   * Safety-relevant categories (stockout, fraud, sync conflict, license/trial,
   * account suspension, security) cannot be suppressed by user preference for
   * CRITICAL/HIGH notifications — only the channel is mutable (BR-NOT-003).
   */
  public static SAFETY_CATEGORIES: ReadonlySet<NotificationCategory> = new Set<NotificationCategory>([
    'INVENTORY',
    'SYNC',
    'BILLING_TRIAL',
    'SECURITY',
  ]);

  public isSafetyRelevant(category: NotificationCategory): boolean {
    return (
      (this.isCritical || this.isHigh) &&
      NotificationPriority.SAFETY_CATEGORIES.has(category)
    );
  }

  /** Maps a digest frequency to its default channels for the given priority. */
  public static defaultFrequencyFor(
    priority: NotificationPriorityLevel,
  ): NotificationFrequency {
    if (priority === 'MEDIUM') return 'HOURLY_DIGEST';
    if (priority === 'LOW') return 'DAILY_DIGEST';
    return 'IMMEDIATE';
  }
}
