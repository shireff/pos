import { LoyaltyAccount } from '../entities';

/**
 * LoyaltyCalculator computes points to accrue/reverse for a sale or return.
 * The actual ratio (points per EGP) is configurable per company.
 */
export class LoyaltyCalculator {
  private readonly pointsPerPiaster: number;

  public constructor(pointsPerEgp: number) {
    // Convert to per-piaster ratio
    this.pointsPerPiaster = pointsPerEgp / 100;
  }

  public calculateAccrual(amountPiasters: number): number {
    return Math.floor(amountPiasters * this.pointsPerPiaster);
  }

  /**
   * Points to reverse = proportional fraction of points earned on the original sale.
   * @param originalPointsEarned total points earned on the original order
   * @param refundAmountPiasters  amount being refunded
   * @param originalOrderTotalPiasters original order total
   */
  public calculateReversal(
    originalPointsEarned: number,
    refundAmountPiasters: number,
    originalOrderTotalPiasters: number,
  ): number {
    if (originalOrderTotalPiasters === 0) return 0;
    const ratio = refundAmountPiasters / originalOrderTotalPiasters;
    return Math.floor(originalPointsEarned * ratio);
  }
}

/**
 * CustomerCreditService evaluates outstanding credit balance.
 */
export class CustomerCreditService {
  public static outstandingBalance(
    entries: Array<{ type: 'charge' | 'payment'; amountPiasters: number }>,
  ): number {
    return entries.reduce(
      (acc, e) => acc + (e.type === 'charge' ? e.amountPiasters : -e.amountPiasters),
      0,
    );
  }

  public static isOverLimit(outstandingPiasters: number, limitPiasters: number): boolean {
    return outstandingPiasters > limitPiasters;
  }

  public static isOverdue(
    entries: Array<{ type: 'charge' | 'payment'; dueDate: string | null }>,
    asOf: Date = new Date(),
  ): boolean {
    return entries.some(
      (e) => e.type === 'charge' && e.dueDate !== null && new Date(e.dueDate) < asOf,
    );
  }
}

// Suppress unused import warning — LoyaltyAccount is used by consuming code
export { LoyaltyAccount };
