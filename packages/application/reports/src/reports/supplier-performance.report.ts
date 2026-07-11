import { GetSupplierPerformanceQuery } from '@packages/application-purchasing';
import { SupplierLedgerEntryRepository, SupplierPriceHistoryRepository } from '@packages/application-purchasing';

export interface SupplierPerformanceInput {
  companyId: string;
  supplierId?: string;
  from: string;
  to: string;
}

export interface SupplierPerformanceOutput {
  from: string;
  to: string;
  suppliers: {
    supplierId: string;
    onTimeRate: number;
    priceVariance: number;
    purchaseVolume: number;
  }[];
}

export class SupplierPerformanceReport {
  constructor(
    private readonly ledgerRepo: SupplierLedgerEntryRepository,
    private readonly priceHistoryRepo: SupplierPriceHistoryRepository,
  ) {}

  async execute(input: SupplierPerformanceInput): Promise<SupplierPerformanceOutput> {
    const query = new GetSupplierPerformanceQuery(this.ledgerRepo, this.priceHistoryRepo);
    const result = await query.execute({
      supplierId: input.supplierId ?? '',
      companyId: input.companyId,
      dateFrom: input.from,
      dateTo: input.to,
    });

    return {
      from: input.from,
      to: input.to,
      suppliers: [
        {
          supplierId: input.supplierId ?? 'all',
          onTimeRate: result.onTimeDeliveryRate.rate,
          priceVariance: result.priceVariance,
          purchaseVolume: 0,
        },
      ],
    };
  }
}
