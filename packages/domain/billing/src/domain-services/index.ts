import { Subscription } from '../aggregates';
import { SubscriptionPlan } from '../entities';

/**
 * EntitlementResolver evaluates a company's effective feature access.
 * Implements the 5-step precedence from Database.md §2.16.1.
 */
export class EntitlementResolver {
  public static resolve(
    subscription: Subscription,
    plan: SubscriptionPlan | null,
    asOf: Date = new Date(),
  ): 'full' | 'plan' | 'locked' {
    return subscription.resolveEntitlement(plan, asOf);
  }

  public static isWriteLocked(subscription: Subscription, asOf: Date = new Date()): boolean {
    return subscription.isWriteLocked(asOf);
  }

  /**
   * Returns true if the given feature flag is accessible under the current entitlement.
   */
  public static canAccess(
    subscription: Subscription,
    plan: SubscriptionPlan | null,
    feature: keyof import('../value-objects').PlanFeatureFlags,
    asOf: Date = new Date(),
  ): boolean {
    const level = EntitlementResolver.resolve(subscription, plan, asOf);
    if (level === 'full') return true;
    if (level === 'locked') return false;
    if (!plan) return false;
    return plan.isFeatureEnabled(feature);
  }
}

export class SubscriptionWriteLockGuard {
  public static ensureWritable(subscription: Subscription, asOf: Date = new Date()): void {
    if (EntitlementResolver.isWriteLocked(subscription, asOf)) {
      throw new Error('Subscription is write-locked and cannot be modified at this time');
    }
  }
}

/**
 * TrialReminder determines which reminder tier applies based on days remaining.
 * Fires at day 10, 13 (from end), and at expiry.
 */
export class TrialReminder {
  public static getReminderTier(
    trialEndsAt: string,
    asOf: Date = new Date(),
  ): 'day10' | 'day13' | 'expired' | null {
    const msRemaining = new Date(trialEndsAt).getTime() - asOf.getTime();
    const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

    if (msRemaining <= 0) return 'expired';
    if (daysRemaining <= 1) return 'day13';
    if (daysRemaining <= 4) return 'day10';
    return null;
  }
}
