import { Customer, LoyaltyAccount, LoyaltyEvent, CreditLedger, CreditLedgerEntry } from '@packages/domain-crm';
import { CustomerRepository, LoyaltyAccountRepository, CreditLedgerBalanceRepository } from '../ports';

export interface GetCustomerInput {
  companyId: string;
  customerId: string;
}

export interface GetCustomerResult {
  customer: Customer;
  loyaltyAccount: LoyaltyAccount | null;
  creditLedger: CreditLedger | null;
  recentEvents: LoyaltyEvent[];
  recentCreditEntries: CreditLedgerEntry[];
}

export class GetCustomerQuery {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly loyaltyAccountRepo: LoyaltyAccountRepository,
    private readonly creditLedgerRepo: CreditLedgerBalanceRepository,
    private readonly loyaltyEventRepo: { findByCustomer(customerId: string, companyId: string, limit: number): Promise<LoyaltyEvent[]> },
    private readonly creditEntryRepo: { findByCustomer(customerId: string, companyId: string, limit: number): Promise<CreditLedgerEntry[]> },
  ) {}

  async execute(input: GetCustomerInput): Promise<GetCustomerResult> {
    const customer = await this.customerRepo.findById(input.customerId, input.companyId);
    if (!customer) {
      throw new Error(`Customer ${input.customerId} not found`);
    }

    const loyaltyAccount = await this.loyaltyAccountRepo.findByCustomer(input.customerId, input.companyId);
    const creditLedger = await this.creditLedgerRepo.findByCustomer(input.customerId, input.companyId);
    const recentEvents = await this.loyaltyEventRepo.findByCustomer(input.customerId, input.companyId, 10);
    const recentCreditEntries = await this.creditEntryRepo.findByCustomer(input.customerId, input.companyId, 10);

    return {
      customer,
      loyaltyAccount,
      creditLedger,
      recentEvents,
      recentCreditEntries,
    };
  }
}
