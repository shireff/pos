import { LoyaltyAccount, LoyaltyEvent, LoyaltyPointsRedeemed } from '@packages/domain-crm';
import { LoyaltyAccountRepository, LoyaltyEventRepository } from '../ports';
import { getMinimumRedemptionThreshold } from '@packages/domain-crm';

export interface RedeemLoyaltyInput {
  companyId: string;
  customerId: string;
  points: number;
  orderId?: string | null;
}

export interface RedeemLoyaltyResult {
  event: LoyaltyEvent;
  newBalance: number;
  redeemedValuePiasters: number;
}

export class RedeemLoyaltyPointsCommand {
  constructor(
    private readonly loyaltyAccountRepo: LoyaltyAccountRepository,
    private readonly loyaltyEventRepo: LoyaltyEventRepository,
  ) {}

  async execute(input: RedeemLoyaltyInput): Promise<RedeemLoyaltyResult> {
    const minThreshold = getMinimumRedemptionThreshold();
    if (input.points < minThreshold) {
      throw new Error(`Minimum redemption threshold is ${minThreshold} points`);
    }

    let account = await this.loyaltyAccountRepo.findByCustomer(input.customerId, input.companyId);
    if (!account) {
      throw new Error('Loyalty account not found for customer');
    }

    account.applyRedemption(input.points);
    await this.loyaltyAccountRepo.save(account);

    const event = LoyaltyEvent.create({
      companyId: input.companyId,
      customerId: input.customerId,
      eventType: 'redemption',
      amountPoints: input.points,
      referenceType: input.orderId ? 'Order' : null,
      referenceId: input.orderId ?? null,
      occurredAt: new Date().toISOString(),
    });

    await this.loyaltyEventRepo.append(event);

    const redeemedValuePiasters = input.points * 100;

    return {
      event,
      newBalance: account.pointsBalance,
      redeemedValuePiasters,
    };
  }
}
