import { PurchaseOrder } from '../aggregates';

/**
 * SupplierPerformanceCalculator computes on-time delivery % and price variance.
 * All calculations are deterministic — LLM generates only the narrative explanation.
 */
export class SupplierPerformanceCalculator {
  /**
   * On-time delivery = POs received by expected date / total POs received.
   * @param deliveries Array of { expectedDate, receivedAt } pairs.
   */
  public static onTimeDeliveryRate(
    deliveries: Array<{ expectedDate: string; receivedAt: string }>,
  ): number {
    if (deliveries.length === 0) return 0;
    const onTime = deliveries.filter(
      (d) => new Date(d.receivedAt) <= new Date(d.expectedDate),
    ).length;
    return onTime / deliveries.length;
  }

  /**
   * Price variance = (current average unit cost - historical average unit cost) / historical average unit cost.
   */
  public static priceVariance(historicalAvg: number, currentAvg: number): number {
    if (historicalAvg === 0) return 0;
    return (currentAvg - historicalAvg) / historicalAvg;
  }
}

/**
 * PODiscrepancyChecker checks whether a received PO has any quantity discrepancies.
 */
export class PODiscrepancyChecker {
  public static hasDiscrepancy(po: PurchaseOrder): boolean {
    return po.lines.some((line) => line.discrepancy !== 0);
  }
}
