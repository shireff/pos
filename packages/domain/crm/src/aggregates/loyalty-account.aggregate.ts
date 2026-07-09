import { LoyaltyTier, getTierForPoints, LOYALTY_TIER_CONFIG } from '../value-objects';

export interface LoyaltyAccountProps {
  companyId: string;
  customerId: string;
  pointsBalance: number;
  tierId: LoyaltyTier;
}

export class LoyaltyAccount {
  public readonly companyId: string;
  public readonly customerId: string;
  public pointsBalance: number;
  public tierId: LoyaltyTier;

  private constructor(props: LoyaltyAccountProps) {
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.pointsBalance = props.pointsBalance;
    this.tierId = props.tierId;
  }

  public static create(companyId: string, customerId: string): LoyaltyAccount {
    return new LoyaltyAccount({
      companyId,
      customerId,
      pointsBalance: 0,
      tierId: 'bronze',
    });
  }

  public static reconstitute(props: LoyaltyAccountProps): LoyaltyAccount {
    return new LoyaltyAccount(props);
  }

  public applyAccrual(points: number): void {
    if (points <= 0) throw new Error('Accrual points must be positive');
    this.pointsBalance += points;
    this.recomputeTier();
  }

  public applyRedemption(points: number): void {
    if (points <= 0) throw new Error('Redemption points must be positive');
    if (points > this.pointsBalance) throw new Error('Insufficient loyalty points');
    this.pointsBalance -= points;
    this.recomputeTier();
  }

  public applyReversal(points: number): void {
    if (points <= 0) throw new Error('Reversal points must be positive');
    this.pointsBalance += points;
    this.recomputeTier();
  }

  public applyAdjustment(delta: number): void {
    this.pointsBalance = Math.max(0, this.pointsBalance + delta);
    this.recomputeTier();
  }

  private recomputeTier(): void {
    this.tierId = getTierForPoints(this.pointsBalance);
  }
}
