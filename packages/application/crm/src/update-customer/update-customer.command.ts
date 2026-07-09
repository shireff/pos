import { Customer } from '@packages/domain-crm';
import { CustomerRepository } from '../ports';

export interface UpdateCustomerInput {
  customerId: string;
  companyId: string;
  name?: string;
  phone?: string;
  email?: string | null;
  creditLimitPiasters?: number;
  notes?: string | null;
}

export class UpdateCustomerCommand {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<Customer> {
    const customer = await this.customerRepo.findById(input.customerId, input.companyId);
    if (!customer) {
      throw new Error(`Customer ${input.customerId} not found`);
    }

    if (input.phone && input.phone !== customer.phone) {
      const existing = await this.customerRepo.findByPhone(input.phone, input.companyId);
      if (existing && existing.id !== input.customerId) {
        throw new Error(`Customer with phone ${input.phone} already exists`);
      }
    }

    customer.updateProfile({
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
