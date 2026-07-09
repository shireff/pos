import { LoyaltyEvent } from '@packages/domain-crm';
import { LoyaltyEventRepository } from '../ports';

export interface GetLoyaltyHistoryInput {
  companyId: string;
  customerId: string;
  limit: number;
  offset: number;
}

export interface GetLoyaltyHistoryResult {
  events: LoyaltyEvent[];
  total: number;
}

export class GetLoyaltyHistoryQuery {
  constructor(private readonly loyaltyEventRepo: LoyaltyEventRepository) {}

  async execute(input: GetLoyaltyHistoryInput): Promise<GetLoyaltyHistoryResult> {
    const events = await this.loyaltyEventRepo.findByCustomer(
      input.customerId,
      input.companyId,
      input.limit,
      input.offset,
    );
    const total = await this.loyaltyEventRepo.countByCustomer(input.customerId, input.companyId);

    return {
      events,
      total,
    };
  }
}
