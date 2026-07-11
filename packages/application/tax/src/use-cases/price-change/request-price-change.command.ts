import { PriceChange, PriceChangeStatus } from '@packages/domain-tax';
import { PriceChangeRepository } from '../../ports';

export interface RequestPriceChangeInput {
  companyId: string;
  productId: string;
  variantId?: string | null;
  oldPricePiasters: number;
  newPricePiasters: number;
  requestedByUserId: string;
  notes?: string | null;
  autoApproveThresholdPiasters: number;
}

export class RequestPriceChangeCommand {
  constructor(private readonly priceChangeRepo: PriceChangeRepository) {}

  async execute(input: RequestPriceChangeInput): Promise<PriceChange> {
    const priceChange = PriceChange.create({
      companyId: input.companyId,
      productId: input.productId,
      variantId: input.variantId ?? null,
      oldPricePiasters: input.oldPricePiasters,
      newPricePiasters: input.newPricePiasters,
      requestedByUserId: input.requestedByUserId,
      notes: input.notes ?? null,
      requestedAt: new Date().toISOString(),
    });

    if (Math.abs(input.newPricePiasters - input.oldPricePiasters) <= input.autoApproveThresholdPiasters) {
      priceChange.approve(input.requestedByUserId);
    }

    await this.priceChangeRepo.save(priceChange);
    return priceChange;
  }
}
