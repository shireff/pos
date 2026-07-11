import {
  Customer,
  LoyaltyAccount,
  LoyaltyEvent,
  CreditLedger,
  CreditLedgerEntry,
  CustomerStatus,
} from '@packages/domain-crm';

export interface CustomerFilter {
  search?: string;
  status?: CustomerStatus;
  limit?: number;
  offset?: number;
}

export interface CustomerRepository {
  findById(id: string, companyId: string): Promise<Customer | null>;
  findByCompany(companyId: string, filter?: CustomerFilter): Promise<Customer[]>;
  findByPhone(phone: string, companyId: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
}

export interface LoyaltyAccountRepository {
  findByCustomer(customerId: string, companyId: string): Promise<LoyaltyAccount | null>;
  save(account: LoyaltyAccount): Promise<void>;
}

export interface LoyaltyEventRepository {
  findByCustomer(
    customerId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<LoyaltyEvent[]>;
  append(event: LoyaltyEvent): Promise<void>;
  countByCustomer(customerId: string, companyId: string): Promise<number>;
}

export interface CreditLedgerRepository {
  findByCustomer(
    customerId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<CreditLedgerEntry[]>;
  append(entry: CreditLedgerEntry): Promise<void>;
  countByCustomer(customerId: string, companyId: string): Promise<number>;
}

export interface CreditLedgerBalanceRepository {
  findByCustomer(customerId: string, companyId: string): Promise<CreditLedger | null>;
  save(ledger: CreditLedger): Promise<void>;
}
