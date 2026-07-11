import { Customer, CustomerStatus } from '@packages/domain-crm';
import { CustomerRepository } from '../ports';

export interface SearchCustomersInput {
  companyId: string;
  query: string;
  status?: CustomerStatus;
  limit?: number;
  offset?: number;
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
      status: input.status,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      customers,
      total: customers.length,
    };
  }
}
