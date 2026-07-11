import { MongoInventoryValuationSnapshotRepository } from '../ports';

export interface InventoryValuationInput {
  companyId: string;
  warehouseId?: string;
  date: string;
}

export interface InventoryValuationOutput {
  date: string;
  warehouseId: string;
  totalPortfolioValue: number;
  items: { productId: string; variantId: string | null; batchId: string | null; quantity: number; unitCost: number; totalValue: number }[];
}

export class InventoryValuationReport {
  constructor(private readonly valuationRepo: MongoInventoryValuationSnapshotRepository) {}

  async execute(input: InventoryValuationInput): Promise<InventoryValuationOutput> {
    const warehouseId = input.warehouseId ?? 'all';
    const snapshots = await this.valuationRepo.findByCompanyWarehouseDate(input.companyId, warehouseId, input.date);
    const items = snapshots.map((s) => ({
      productId: s.productId,
      variantId: s.variantId,
      batchId: s.batchId,
      quantity: s.quantityOnHand,
      unitCost: s.costPricePiasters,
      totalValue: s.totalValuePiasters,
    }));
    return {
      date: input.date,
      warehouseId,
      totalPortfolioValue: items.reduce((sum, item) => sum + item.totalValue, 0),
      items,
    };
  }
}
