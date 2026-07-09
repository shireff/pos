import { LoyaltyAccount, LoyaltyEvent, LoyaltyPointsReversed } from '@packages/domain-crm';
import { LoyaltyAccountRepository, LoyaltyEventRepository } from '../ports';

export interface ReverseLoyaltyInput {
  companyId: string;
  customerId: string;
  pointsToReverse: number;
  returnId: string;
  originalOrderId: string;
}

export interface ReverseLoyaltyResult {
  event: LoyaltyEvent;
  newBalance: number;
}

export class ReverseLoyaltyPointsCommand {
  constructor(
    private readonly loyaltyAccountRepo: LoyaltyAccountRepository,
    private readonly loyaltyEventRepo: LoyaltyEventRepository,
  ) {}

  async execute(input: ReverseLoyaltyInput): Promise<ReverseLoyaltyResult> {
    if (input.pointsToReverse <= 0) {
      return { event: null as unknown as LoyaltyEvent, newBalance: 0 };
    }

    let account = await this.loyaltyAccountRepo.findByCustomer(input.customerId, input.companyId);
    if (!account) {
      account = LoyaltyAccount.create(input.companyId, input.customerId);
    }

    account.applyReversal(input.pointsToReverse);
    await this.loyaltyAccountRepo.save(account);

    const event = LoyaltyEvent.create({
      companyId: input.companyId,
      customerId: input.customerId,
      eventType: 'reversal',
      amountPoints: input.pointsToReverse,
      referenceType: 'Return',
      referenceId: input.returnId,
      occurredAt: new Date().toISOString(),
    });

    await this.loyaltyEventRepo.append(event);

    return {
      event,
      newBalance: account.pointsBalance,
    };
  }
}
