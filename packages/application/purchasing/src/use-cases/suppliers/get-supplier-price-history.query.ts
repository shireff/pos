import { SupplierPriceHistory } from '@packages/domain-purchasing';
import { SupplierPriceHistoryRepository } from '../../ports';

export interface GetSupplierPriceHistoryInput {
  supplierId: string;
  companyId: string;
  productId?: string;
  limit?: number;
  offset?: number;
}

export interface GetSupplierPriceHistoryResult {
  entries: SupplierPriceHistory[];
  total: number;
}

export class GetSupplierPriceHistoryQuery {
  constructor(private readonly repo: SupplierPriceHistoryRepository) {}

  async execute(input: GetSupplierPriceHistoryInput): Promise<GetSupplierPriceHistoryResult> {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    const entries = await this.repo.findBySupplier(
      input.supplierId,
      input.companyId,
      input.productId,
      limit,
      offset,
    );

    return {
      entries,
      total: entries.length,
    };
  }
}
