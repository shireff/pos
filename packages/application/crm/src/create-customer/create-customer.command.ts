import { Identifier } from '@packages/shared-kernel';
import { Customer } from '@packages/domain-crm';
import { CustomerRepository } from '../ports';

export interface CreateCustomerInput {
  companyId: string;
  name: string;
  phone: string;
  email?: string | null;
  creditLimitPiasters?: number;
  notes?: string | null;
  createdByUserId?: string;
}

export class CreateCustomerCommand {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    const existing = await this.customerRepo.findByPhone(input.phone, input.companyId);
    if (existing) {
      throw new Error(`Customer with phone ${input.phone} already exists in this company`);
    }

    const customer = Customer.create({
      companyId: input.companyId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      creditLimitPiasters: input.creditLimitPiasters,
      notes: input.notes,
    });

    await this.customerRepo.save(customer);
    return customer;
  }
}
