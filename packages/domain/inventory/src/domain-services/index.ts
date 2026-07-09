import { StockMovementEvent, StockItem } from '../aggregates';
import { Batch } from '../entities';

export class StockProjectionService {
  public static applyEvents(stockItem: StockItem, events: StockMovementEvent[]): void {
    for (const event of events) {
      stockItem.applyEvent(event);
    }
  }

  public static projectQuantity(events: StockMovementEvent[]): number {
    return events.reduce((sum, e) => sum + e.quantity, 0);
  }

  public static recompute(events: StockMovementEvent[]): { quantityOnHand: number; updatedFromSequence: number } {
    const quantityOnHand = events.reduce((sum, e) => sum + e.quantity, 0);
    const maxSeq = events.reduce((max, e) => {
      const seq = Number(e.occurredAt);
      return seq > max ? seq : max;
    }, 0);
    return { quantityOnHand, updatedFromSequence: maxSeq };
  }
}

export class FefoService {
  public static sortByExpiry(batches: Batch[]): Batch[] {
    return [...batches].sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  }

  public static nextBatchForSale(batches: Batch[], asOfDate: Date = new Date()): Batch | null {
    const eligible = batches.filter((b) => !b.isExpired(asOfDate) && !b.isDeleted);
    const sorted = FefoService.sortByExpiry(eligible);
    return sorted[0] ?? null;
  }
}

export class NegativeStockError extends Error {
  public constructor(
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly requestedQuantity: number,
    public readonly currentQuantity: number,
  ) {
    super(`Negative stock guard: cannot reduce stock below zero for product ${productId} in warehouse ${warehouseId}`);
    this.name = 'NegativeStockError';
  }
}

export class NegativeStockGuardService {
  public static verify(
    currentQuantity: number,
    requestedQuantity: number,
    productId: string,
    warehouseId: string,
  ): void {
    if (currentQuantity - requestedQuantity < 0) {
      throw new NegativeStockError(productId, warehouseId, requestedQuantity, currentQuantity);
    }
  }
}

export class BatchExpiredError extends Error {
  public constructor(
    public readonly batchId: string,
    public readonly productId: string,
    public readonly expiryDate: string,
  ) {
    super(`Batch ${batchId} for product ${productId} expired on ${expiryDate}`);
    this.name = 'BatchExpiredError';
  }
}

export class BatchExpiryGuardService {
  public static verify(batch: Batch, productId: string): void {
    if (batch.isExpired()) {
      throw new BatchExpiredError(batch.id, productId, batch.expiryDate ?? 'unknown');
    }
  }
}

export class ReorderPointReachedError extends Error {
  public constructor(
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly quantityOnHand: number,
    public readonly reorderPoint: number,
  ) {
    super(`Reorder point reached for product ${productId} in warehouse ${warehouseId}: ${quantityOnHand} <= ${reorderPoint}`);
    this.name = 'ReorderPointReachedError';
  }
}

export class ReorderPointGuardService {
  public static verify(stockItem: StockItem, productId: string, warehouseId: string): void {
    if (stockItem.isBelowReorderPoint()) {
      throw new ReorderPointReachedError(productId, warehouseId, stockItem.quantityOnHand, stockItem.reorderPoint);
    }
  }
}

export interface BundleDeductionComponent {
  productId: string;
  variantId: string | null;
  quantity: number;
  deductionRatio: number;
}

export class BundleDeductionService {
  public static calculateComponentDeductions(
    bundleQty: number,
    components: readonly BundleDeductionComponent[],
  ): number[] {
    if (!Number.isInteger(bundleQty) || bundleQty < 0) {
      throw new Error('bundleQty must be a non-negative integer');
    }

    const totalRatio = components.reduce((sum, c) => sum + c.deductionRatio, 0);
    if (totalRatio > 1) throw new Error('Bundle deduction ratios cannot exceed 1.0');

    return components.map((component) => {
      if (component.quantity <= 0) throw new Error('Component quantity must be positive');
      if (component.deductionRatio < 0 || component.deductionRatio > 1) {
        throw new Error('Component deduction ratio must be between 0 and 1');
      }

      return Math.floor(bundleQty * component.quantity * component.deductionRatio);
    });
  }

  public static toEvents(
    bundleQty: number,
    warehouseId: string,
    components: readonly BundleDeductionComponent[],
    referenceType: string,
    referenceId: string,
  ): Array<{
    productId: string;
    variantId: string | null;
    warehouseId: string;
    eventType: 'BUNDLE_DEDUCTION';
    quantity: number;
    referenceType: string;
    referenceId: string;
  }> {
    const deductions = BundleDeductionService.calculateComponentDeductions(bundleQty, components);
    return components.map((component, index) => ({
      productId: component.productId,
      variantId: component.variantId,
      warehouseId,
      eventType: 'BUNDLE_DEDUCTION' as const,
      quantity: -deductions[index],
      referenceType,
      referenceId,
    }));
  }
}
