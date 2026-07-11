import { MongoReportStockMovementRepository } from '../ports';

export interface StockMovementInput {
  companyId: string;
  warehouseId: string;
  from: string;
  to: string;
}

export interface StockMovementOutput {
  warehouseId: string;
  from: string;
  to: string;
  netFlow: Record<string, number>;
  events: { productId: string; eventType: string; quantity: number; createdAt: string }[];
}

export class StockMovementReport {
  constructor(private readonly movementRepo: MongoReportStockMovementRepository) {}

  async execute(input: StockMovementInput): Promise<StockMovementOutput> {
    const events = await this.movementRepo.findByCompanyWarehouseDateRange(
      input.companyId,
      input.warehouseId,
      input.from,
      input.to,
    );
    const netFlow: Record<string, number> = {};
    for (const event of events) {
      netFlow[event.productId] = (netFlow[event.productId] ?? 0) + event.quantity;
    }
    return {
      warehouseId: input.warehouseId,
      from: input.from,
      to: input.to,
      netFlow,
      events: events.map((e) => ({
        productId: e.productId,
        eventType: e.eventType,
        quantity: e.quantity,
        createdAt: e.createdAt,
      })),
    };
  }
}
