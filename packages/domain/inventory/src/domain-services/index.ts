import { StockMovementEvent, StockItem } from '../aggregates';
import { Batch } from '../entities';

/**
 * StockProjectionService computes a current stock quantity from a stream of
 * StockMovementEvents. This is the ONLY way stock quantities are derived —
 * direct writes to quantity_on_hand are forbidden (BR-INV-001).
 */
export class StockProjectionService {
  /**
   * Applies all events to a StockItem projection.
   * Events may arrive in any order; the final sum is always identical (commutative).
   */
  public static applyEvents(stockItem: StockItem, events: StockMovementEvent[]): void {
    const sorted = [...events].sort((a, b) => a.sequenceNo - b.sequenceNo);
    for (const event of sorted) {
      stockItem.applyEvent(event);
    }
  }

  /**
   * Computes the projected quantity from a list of events without mutating a StockItem.
   * Used for validation before committing a new event.
   */
  public static projectQuantity(events: StockMovementEvent[]): number {
    return events.reduce((sum, e) => sum + e.quantityDelta, 0);
  }
}

/**
 * FefoService suggests the next batch to sell/pick based on
 * First-Expire-First-Out ordering.
 */
export class FefoService {
  /**
   * Returns batches sorted by expiry ascending (earliest expiry first).
   * Batches with no expiry date are placed last.
   */
  public static sortByExpiry(batches: Batch[]): Batch[] {
    return [...batches].sort((a, b) => {
      if (!a.expiresAt && !b.expiresAt) return 0;
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });
  }

  /**
   * Returns the next batch to pick for a sale, or null if none available.
   */
  public static nextBatchForSale(batches: Batch[], asOfDate: Date = new Date()): Batch | null {
    const eligible = batches.filter((b) => !b.isExpired(asOfDate) && !b.isDeleted);
    const sorted = FefoService.sortByExpiry(eligible);
    return sorted[0] ?? null;
  }
}
