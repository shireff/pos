import { Customer } from '@packages/domain-crm';
import { LoyaltyAccount, LoyaltyPointEvent, CreditLedgerEntry } from '@packages/domain-crm';

export interface CustomerRepository {
  findById(id: string, companyId: string): Promise<Customer | null>;
  findByPhone(phone: string, companyId: string): Promise<Customer | null>;
  findByLoyaltyCode(code: string, companyId: string): Promise<Customer | null>;
  findAll(companyId: string): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
}

export interface LoyaltyAccountRepository {
  findByCustomer(customerId: string): Promise<LoyaltyAccount | null>;
  findEvents(customerId: string): Promise<LoyaltyPointEvent[]>;
  appendEvent(event: LoyaltyPointEvent): Promise<void>;
  saveAccount(account: LoyaltyAccount): Promise<void>;
}

export interface CreditLedgerRepository {
  findByCustomer(customerId: string): Promise<CreditLedgerEntry[]>;
  /** Append-only — no update or delete permitted. */
  append(entry: CreditLedgerEntry): Promise<void>;
}
