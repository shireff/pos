import { Subscription } from '@packages/domain-billing';
import type { SubscriptionRepository } from '../ports';

export interface UpgradeSubscriptionInput {
  companyId: string;
  planId: string;
}

export interface UpgradeSubscriptionOutput {
  subscription: Subscription;
}

export class UpgradeSubscription {
  public constructor(private readonly subscriptions: SubscriptionRepository) {}

  public async execute(input: UpgradeSubscriptionInput): Promise<UpgradeSubscriptionOutput> {
    const subscription = await this.subscriptions.findByCompany(input.companyId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.activate(input.planId, new Date().toISOString());
    await this.subscriptions.save(subscription);
    return { subscription };
  }
}
