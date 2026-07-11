import { SupplierPerformanceService } from '@packages/domain-purchasing';
import { SupplierLedgerEntryRepository, SupplierPriceHistoryRepository } from '../../ports';

export interface GetSupplierPerformanceInput {
  supplierId: string;
  companyId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetSupplierPerformanceResult {
  onTimeDeliveryRate: { onTimeCount: number; totalCount: number; rate: number };
  priceVariance: number;
  narrative: string;
}

export class GetSupplierPerformanceQuery {
  constructor(
    private readonly ledgerRepo: SupplierLedgerEntryRepository,
    private readonly priceHistoryRepo: SupplierPriceHistoryRepository,
  ) {}

  async execute(input: GetSupplierPerformanceInput): Promise<GetSupplierPerformanceResult> {
    const entries = await this.ledgerRepo.findBySupplier(
      input.supplierId,
      input.companyId,
      1000,
      0,
    );

    const receipts = entries
      .filter((e) => e.eventType === 'invoice')
      .map((e) => ({
        receivedDate: e.occurredAt,
        expectedDeliveryDate: e.occurredAt,
      }));

    const onTimeRate = SupplierPerformanceService.computeOnTimeDeliveryRate(receipts);

    const priceHistory = await this.priceHistoryRepo.findBySupplier(
      input.supplierId,
      input.companyId,
      undefined,
      100,
      0,
    );

    let priceVariance = 0;
    if (priceHistory.length >= 2) {
      const currentPrice = priceHistory[0].unitPricePiasters;
      const referencePrice = priceHistory[priceHistory.length - 1].unitPricePiasters;
      priceVariance = SupplierPerformanceService.computePriceVariance(currentPrice, referencePrice);
    }

    const narrative = SupplierPerformanceService.generateNarrativeStub(onTimeRate.rate, priceVariance);

    return {
      onTimeDeliveryRate: onTimeRate,
      priceVariance,
      narrative,
    };
  }
}
