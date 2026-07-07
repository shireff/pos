import { PlatformAdminAction } from '@packages/domain-platform-admin';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

export interface ExtendTrialInput {
  adminId: string;
  companyId: string;
  newTrialEndsAt: string;
  reason: string;
}

export interface ExtendTrialOutput {
  subscription: Subscription;
}

export class ExtendTrial {
  public constructor(
    private readonly adminById: (id: string) => Promise<PlatformAdminUser | null>,
    private readonly subscriptionRepo: {
      findByCompany: (companyId: string) => Promise<Subscription | null>;
      save: (s: Subscription) => Promise<void>;
    },
    private readonly recordAction: (action: PlatformAdminAction) => Promise<void>,
  ) {}

  public async execute(input: ExtendTrialInput): Promise<ExtendTrialOutput> {
    const admin = await this.adminById(input.adminId);
    if (!admin) throw new Error('Platform admin not found');
    if (!admin.isActive) throw new Error('Platform admin inactive');
    if (!input.reason || input.reason.trim().length === 0) throw new Error('Reason is mandatory');

    const newTrialEndsAt = new Date(input.newTrialEndsAt);
    if (Number.isNaN(newTrialEndsAt.getTime()))
      throw new Error('newTrialEndsAt must be a valid ISO date');

    const subscription = await this.subscriptionRepo.findByCompany(input.companyId);
    if (!subscription) throw new Error('Subscription not found');

    const beforeJson = JSON.stringify({
      trialEndsAt: subscription.trialEndsAt,
      status: subscription.status,
    });
    subscription.extendTrial(newTrialEndsAt.toISOString());
    await this.subscriptionRepo.save(subscription);

    const action = PlatformAdminAction.record({
      platformAdminId: admin.id,
      targetCompanyId: input.companyId,
      actionCode: 'trial_extended',
      reason: input.reason,
      beforeJson,
      afterJson: JSON.stringify({
        trialEndsAt: subscription.trialEndsAt,
        status: subscription.status,
      }),
    });

    await this.recordAction(action);
    return { subscription };
  }
}
