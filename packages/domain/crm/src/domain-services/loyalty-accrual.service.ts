import { LoyaltyTier, LOYALTY_TIER_CONFIG } from '../value-objects';

export class LoyaltyAccrualService {
  public static computePoints(
    orderTotalPiasters: number,
    accrualRatePiastersPerPoint: number = 100,
  ): number {
    if (accrualRatePiastersPerPoint <= 0) return 0;
    return Math.floor(orderTotalPiasters / accrualRatePiastersPerPoint);
  }

  public static getTierForBalance(pointsBalance: number): LoyaltyTier {
    if (pointsBalance >= 15000) return 'platinum';
    if (pointsBalance >= 5000) return 'gold';
    if (pointsBalance >= 1000) return 'silver';
    return 'bronze';
  }

  public static getAccrualMultiplier(tierId: LoyaltyTier): number {
    return LOYALTY_TIER_CONFIG[tierId].accrualMultiplier;
  }
}
