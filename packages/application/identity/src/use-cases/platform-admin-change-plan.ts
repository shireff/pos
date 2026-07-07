import { PlatformAdminAction } from '@packages/domain-platform-admin';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { Subscription } from '@packages/domain-billing';

export interface ChangeTenantPlanInput {
  adminId: string;
  companyId: string;
  planId: string;
  reason: string;
}

export interface ChangeTenantPlanOutput {
  subscription: Subscription;
}

export class ChangeTenantPlan {
  public constructor(
    private readonly adminById: (id: string) => Promise<PlatformAdminUser | null>,
    private readonly subscriptionRepo: {
      findByCompany: (companyId: string) => Promise<Subscription | null>;
      save: (s: Subscription) => Promise<void>;
    },
    private readonly recordAction: (action: PlatformAdminAction) => Promise<void>,
  ) {}

  public async execute(input: ChangeTenantPlanInput): Promise<ChangeTenantPlanOutput> {
    const admin = await this.adminById(input.adminId);
    if (!admin) throw new Error('Platform admin not found');
    if (!admin.isActive) throw new Error('Platform admin inactive');
    if (!admin.isMfaEnrolled) throw new Error('MFA enrollment required');

    if (!input.reason || input.reason.trim().length === 0) throw new Error('Reason is mandatory');

    const subscription = await this.subscriptionRepo.findByCompany(input.companyId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.activate(input.planId, new Date().toISOString());
    await this.subscriptionRepo.save(subscription);

    const action = PlatformAdminAction.record({
      platformAdminId: admin.id,
      targetCompanyId: input.companyId,
      actionCode: 'plan_changed',
      reason: input.reason,
      beforeJson: null,
      afterJson: JSON.stringify({ planId: input.planId }),
    });

    await this.recordAction(action);

    return { subscription };
  }
}
