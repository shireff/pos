import type { Clock } from '../ports';
import { systemClock } from '../ports';
import { SubscriptionTrialStarted } from '@packages/domain-billing';

export interface ActiveTrialEntry {
  companyId: string;
  subscriptionId: string;
  trialEndsAt: string;
}

export interface TrialCountdownDeps {
  findActiveTrials: () => Promise<ActiveTrialEntry[]>;
  publish: (event: SubscriptionTrialStarted) => Promise<void> | void;
  clock?: Clock;
}

/**
 * Trial-countdown scheduler (Notifications.md §3, §8). For every company with
 * an active trial, (re)publish a SubscriptionTrialStarted event carrying the
 * cached server-authoritative trialEndsAt. The TrialApproachingHandler evaluates
 * it against local time so the countdown fires identically everywhere (BR-NOT-007).
 */
export async function runTrialCountdown(deps: TrialCountdownDeps): Promise<number> {
  const clock = deps.clock ?? systemClock;
  const trials = await deps.findActiveTrials();
  let published = 0;
  for (const trial of trials) {
    await deps.publish(
      new SubscriptionTrialStarted({
        subscriptionId: trial.subscriptionId,
        companyId: trial.companyId,
        trialEndsAt: trial.trialEndsAt,
      }),
    );
    published += 1;
  }
  void clock;
  return published;
}
