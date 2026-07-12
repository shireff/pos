import type { NotificationCategory, NotificationChannel } from '@packages/domain-notifications';

/**
 * Preference mutability rules (Notifications.md §5, TESTS.md preferences).
 *
 *  - Billing & Trial category cannot be muted at all during the final 4 days
 *    of the trial (BR-NOT-004). `trialDaysRemaining` is null when the company is
 *    not in trial (paid plan) — in that case muting is allowed.
 *  - Otherwise every (category, channel) pair may be muted by the user.
 *
 * Note: BR-NOT-003 (safety Critical/High) is enforced at delivery time — the
 * dispatcher only ever mutes the *channel*, never the in-app record — and at the
 * entity level via `NotificationPreference.setEnabled`.
 */
export function isChannelMutable(
  category: NotificationCategory,
  _channel: NotificationChannel,
  trialDaysRemaining: number | null,
): boolean {
  if (category === 'BILLING_TRIAL' && trialDaysRemaining !== null && trialDaysRemaining <= 4) {
    return false;
  }
  return true;
}
