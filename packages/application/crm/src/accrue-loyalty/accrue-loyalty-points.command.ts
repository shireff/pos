import { Identifier } from '@packages/shared-kernel';
import { LoyaltyAccount, LoyaltyEvent, LoyaltyPointsAccrued } from '@packages/domain-crm';
import { LoyaltyAccountRepository, LoyaltyEventRepository } from '../ports';

export interface AccrueLoyaltyInput {
  companyId: string;
  customerId: string;
  orderId: string;
  grandTotalPiasters: number;
  accrualRatePiastersPerPoint?: number;
}

export interface AccrueLoyaltyResult {
  event: LoyaltyEvent;
  newBalance: number;
  newTier: string;
}

export class AccrueLoyaltyPointsCommand {
  constructor(
    private readonly loyaltyAccountRepo: LoyaltyAccountRepository,
    private readonly loyaltyEventRepo: LoyaltyEventRepository,
  ) {}

  async execute(input: AccrueLoyaltyInput): Promise<AccrueLoyaltyResult> {
    const rate = input.accrualRatePiastersPerPoint ?? 100;
    const points = Math.max(0, Math.floor(input.grandTotalPiasters / rate));
    if (points === 0) {
      return { event: null as unknown as LoyaltyEvent, newBalance: 0, newTier: 'bronze' };
    }

    let account = await this.loyaltyAccountRepo.findByCustomer(input.customerId, input.companyId);
    if (!account) {
      account = LoyaltyAccount.create(input.companyId, input.customerId);
    }

    account.applyAccrual(points);
    await this.loyaltyAccountRepo.save(account);

    const event = LoyaltyEvent.create({
      companyId: input.companyId,
      customerId: input.customerId,
      eventType: 'accrual',
      amountPoints: points,
      referenceType: 'Order',
      referenceId: input.orderId,
      occurredAt: new Date().toISOString(),
    });

    await this.loyaltyEventRepo.append(event);

    return {
      event,
      newBalance: account.pointsBalance,
      newTier: account.tierId,
    };
  }
}
