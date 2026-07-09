import { CreditLedgerEntry } from '@packages/domain-crm';
import { CreditLedgerRepository } from '../ports';

export interface GetCreditHistoryInput {
  companyId: string;
  customerId: string;
  limit: number;
  offset: number;
}

export interface GetCreditHistoryResult {
  entries: CreditLedgerEntry[];
  total: number;
}

export class GetCreditHistoryQuery {
  constructor(private readonly creditEntryRepo: CreditLedgerRepository) {}

  async execute(input: GetCreditHistoryInput): Promise<GetCreditHistoryResult> {
    const entries = await this.creditEntryRepo.findByCustomer(
      input.customerId,
      input.companyId,
      input.limit,
      input.offset,
    );
    const total = await this.creditEntryRepo.countByCustomer(input.customerId, input.companyId);

    return {
      entries,
      total,
    };
  }
}
