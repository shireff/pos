import { Subscription } from '@packages/domain-billing';
import type { SubscriptionRepository } from '../ports';

export interface StartTrialInput {
  companyId: string;
}

export interface StartTrialOutput {
  subscription: Subscription;
}

export class StartTrial {
  public constructor(private readonly subscriptions: SubscriptionRepository) {}

  public async execute(input: StartTrialInput): Promise<StartTrialOutput> {
    const now = new Date().toISOString();
    const subscription = new Subscription({
      id: `sub_${input.companyId}`,
      companyId: input.companyId,
      planId: null,
      status: 'trial',
      trialStartedAt: now,
      trialEndsAt: new Date(new Date(now).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      activatedAt: null,
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.subscriptions.save(subscription);
    return { subscription };
  }
}
