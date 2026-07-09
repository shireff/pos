export const CustomerStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const;

export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const LoyaltyTier = {
  Bronze: 'bronze',
  Silver: 'silver',
  Gold: 'gold',
  Platinum: 'platinum',
} as const;

export type LoyaltyTier = (typeof LoyaltyTier)[keyof typeof LoyaltyTier];

export const LoyaltyEventType = {
  Accrual: 'accrual',
  Redemption: 'redemption',
  Reversal: 'reversal',
  Expiry: 'expiry',
  Adjustment: 'adjustment',
} as const;

export type LoyaltyEventType = (typeof LoyaltyEventType)[keyof typeof LoyaltyEventType];

export const CreditEventType = {
  PurchaseOnCredit: 'purchase_on_credit',
  Payment: 'payment',
  CreditNote: 'credit_note',
  Adjustment: 'adjustment',
} as const;

export type CreditEventType = (typeof CreditEventType)[keyof typeof CreditEventType];

export const LOYALTY_TIER_CONFIG: Record<
  LoyaltyTier,
  { minPoints: number; accrualMultiplier: number }
> = {
  bronze: { minPoints: 0, accrualMultiplier: 1.0 },
  silver: { minPoints: 1000, accrualMultiplier: 1.2 },
  gold: { minPoints: 5000, accrualMultiplier: 1.5 },
  platinum: { minPoints: 15000, accrualMultiplier: 2.0 },
};

export function getTierForPoints(pointsBalance: number): LoyaltyTier {
  if (pointsBalance >= 15000) return 'platinum';
  if (pointsBalance >= 5000) return 'gold';
  if (pointsBalance >= 1000) return 'silver';
  return 'bronze';
}

export function getMinimumRedemptionThreshold(): number {
  return 100;
}
