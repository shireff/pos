import type { NotificationPriorityLevel } from '@packages/domain-notifications';
import type {
  Clock,
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { systemClock } from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TrialCountdownEvent {
  companyId: string;
  trialEndsAt: string;
}

export interface TrialClassification {
  shouldFire: boolean;
  daysRemaining: number;
  priority: NotificationPriorityLevel;
  titleKey: string;
  bodyKey: string;
  triggerCode: string;
  vars: Record<string, number>;
}

/**
 * Trial countdown trigger (Notifications.md §3, TESTS.md trial-countdown).
 *
 * Pure, clock-injectable classifier so the countdown can be exercised by the
 * clock-simulation test without real-time waiting (BR-NOT-007 / BR-LIC-008):
 * every device evaluates its own cached trialEndsAt against local device time.
 *
 *  - daysRemaining === 7  → HIGH   (trial ending soon)
 *  - daysRemaining === 10 → HIGH   (trial ending soon)
 *  - daysRemaining === 13 → CRITICAL (final reminder)
 *  - daysRemaining <= 1   → CRITICAL (trial ending today)
 */
export class TrialApproachingHandler implements NotificationHandler<TrialCountdownEvent> {
  public readonly eventType = 'SubscriptionTrialStarted';

  constructor(private readonly clock: Clock = systemClock) {}

  public classify(trialEndsAt: string): TrialClassification {
    const now = this.clock.now();
    const ms = new Date(trialEndsAt).getTime() - now.getTime();
    const daysRemaining = Math.ceil(ms / DAY_MS);

    if (ms <= 0) {
      return {
        shouldFire: false,
        daysRemaining,
        priority: 'CRITICAL',
        titleKey: NOTIFICATION_KEYS.trialExpired,
        bodyKey: NOTIFICATION_KEYS.trialExpired,
        triggerCode: 'TRIAL_EXPIRED',
        vars: { days: 0 },
      };
    }

    if (daysRemaining <= 1) {
      return this.fire('CRITICAL', NOTIFICATION_KEYS.trialApproaching13, 'TRIAL_ENDING_TODAY', daysRemaining);
    }
    if (daysRemaining === 13) {
      return this.fire('CRITICAL', NOTIFICATION_KEYS.trialApproaching13, 'TRIAL_APPROACHING_13', daysRemaining);
    }
    if (daysRemaining === 10) {
      return this.fire('HIGH', NOTIFICATION_KEYS.trialApproaching10, 'TRIAL_APPROACHING_10', daysRemaining);
    }
    if (daysRemaining === 7) {
      return this.fire('HIGH', NOTIFICATION_KEYS.trialApproaching7, 'TRIAL_APPROACHING_7', daysRemaining);
    }

    return {
      shouldFire: false,
      daysRemaining,
      priority: 'HIGH',
      titleKey: NOTIFICATION_KEYS.trialApproaching10,
      bodyKey: NOTIFICATION_KEYS.trialApproaching10,
      triggerCode: 'TRIAL_APPROACHING',
      vars: { days: daysRemaining },
    };
  }

  private fire(
    priority: NotificationPriorityLevel,
    key: string,
    triggerCode: string,
    daysRemaining: number,
  ): TrialClassification {
    return {
      shouldFire: true,
      daysRemaining,
      priority,
      titleKey: key,
      bodyKey: key,
      triggerCode,
      vars: { days: daysRemaining },
    };
  }

  public async handle(
    event: TrialCountdownEvent,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const classification = this.classify(event.trialEndsAt);
    if (!classification.shouldFire) return [];
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: classification.triggerCode,
        category: 'BILLING_TRIAL',
        priority: classification.priority,
        titleKey: classification.titleKey,
        bodyKey: classification.bodyKey,
        vars: classification.vars,
      }),
    ];
  }
}
