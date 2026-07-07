import { PlatformAdminAction } from '@packages/domain-platform-admin';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

export interface SuspendTenantInput {
  adminId: string;
  companyId: string;
  reason: string;
}

export interface SuspendTenantOutput {
  subscription: Subscription;
}

export class SuspendTenant {
  public constructor(
    private readonly adminById: (id: string) => Promise<PlatformAdminUser | null>,
    private readonly subscriptionRepo: {
      findByCompany: (companyId: string) => Promise<Subscription | null>;
      save: (s: Subscription) => Promise<void>;
    },
    private readonly recordAction: (action: PlatformAdminAction) => Promise<void>,
  ) {}

  public async execute(input: SuspendTenantInput): Promise<SuspendTenantOutput> {
    const admin = await this.adminById(input.adminId);
    if (!admin) throw new Error('Platform admin not found');
    if (!admin.isActive) throw new Error('Platform admin inactive');
    if (!input.reason || input.reason.trim().length === 0) throw new Error('Reason is mandatory');

    const subscription = await this.subscriptionRepo.findByCompany(input.companyId);
    if (!subscription) throw new Error('Subscription not found');

    const beforeJson = JSON.stringify({
      status: subscription.status,
      lockReason: subscription.lockReason,
    });
    subscription.suspend(admin.id, input.reason);
    await this.subscriptionRepo.save(subscription);

    const action = PlatformAdminAction.record({
      platformAdminId: admin.id,
      targetCompanyId: input.companyId,
      actionCode: 'account_locked',
      reason: input.reason,
      beforeJson,
      afterJson: JSON.stringify({
        status: subscription.status,
        lockReason: subscription.lockReason,
      }),
    });

    await this.recordAction(action);
    return { subscription };
  }
}
