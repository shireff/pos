import { Subscription } from '@packages/domain-billing';
import type { SubscriptionRepository, TrialNotificationDispatcher } from '../ports';

export interface ExpireTrialJobInput {
  asOfIso?: string;
}

export interface ExpireTrialJobOutput {
  processed: number;
}

export class ExpireTrialJob {
  public constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly notifier: TrialNotificationDispatcher,
  ) {}

  public async run(input: ExpireTrialJobInput = {}): Promise<ExpireTrialJobOutput> {
    const asOf = input.asOfIso ?? new Date().toISOString();
    const due: Subscription[] = await this.subscriptions.findTrialsEndingBefore(asOf);

    for (const subscription of due) {
      subscription.expireTrial();
      await this.subscriptions.save(subscription);
      await this.notifier.dispatchTrialExpired(subscription.companyId);
    }

    return { processed: due.length };
  }
}
