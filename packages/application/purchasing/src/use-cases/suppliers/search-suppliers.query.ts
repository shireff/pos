import { Supplier } from '@packages/domain-purchasing';
import { SupplierRepository, SupplierFilter } from '../../ports';

export interface SearchSuppliersInput {
  companyId: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchSuppliersResult {
  suppliers: Supplier[];
  total: number;
}

export class SearchSuppliersQuery {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: SearchSuppliersInput): Promise<SearchSuppliersResult> {
    const filter: SupplierFilter = {
      search: input.search,
      isActive: input.isActive,
      limit: input.limit,
      offset: input.offset,
    };

    const suppliers = await this.repo.findByCompany(input.companyId, filter);

    return {
      suppliers,
      total: suppliers.length,
    };
  }
}
