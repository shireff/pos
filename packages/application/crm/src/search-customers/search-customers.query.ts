import { Customer } from '@packages/domain-crm';
import { CustomerRepository } from '../ports';

export interface SearchCustomersInput {
  companyId: string;
  query: string;
  isActive?: boolean;
  limit?: number;
}

export interface SearchCustomersResult {
  customers: Customer[];
  total: number;
}

export class SearchCustomersQuery {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: SearchCustomersInput): Promise<SearchCustomersResult> {
    const customers = await this.customerRepo.findByCompany(input.companyId, {
      search: input.query,
      isActive: input.isActive,
    });

    return {
      customers,
      total: customers.length,
    };
  }
}
