import { Supplier } from '@packages/domain-purchasing';
import {
  SupplierLedgerEntryRepository,
  SupplierPriceHistoryRepository,
  SupplierRepository,
} from '@packages/application-purchasing';

export interface GetSupplierInput {
  supplierId: string;
  companyId: string;
}

export interface GetSupplierResult {
  supplier: Supplier;
  recentLedgerEntries: any[];
  recentPriceHistory: any[];
}

export class GetSupplierQuery {
  constructor(
    private readonly repo: SupplierRepository,
    private readonly ledgerRepo: SupplierLedgerEntryRepository,
    private readonly priceHistoryRepo: SupplierPriceHistoryRepository,
  ) {}

  async execute(input: GetSupplierInput): Promise<GetSupplierResult> {
    const supplier = await this.repo.findById(input.supplierId, input.companyId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const recentLedgerEntries = await this.ledgerRepo.findBySupplier(
      input.supplierId,
      input.companyId,
      10,
      0,
    );

    const recentPriceHistory = await this.priceHistoryRepo.findBySupplier(
      input.supplierId,
      input.companyId,
      undefined,
      10,
      0,
    );

    return {
      supplier,
      recentLedgerEntries,
      recentPriceHistory,
    };
  }
}
