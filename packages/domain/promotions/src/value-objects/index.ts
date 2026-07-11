export type DiscountType =
  | 'item'
  | 'cart'
  | 'category'
  | 'customer'
  | 'membership'
  | 'time_based'
  | 'buy_x_get_y'
  | 'quantity_break';

export type CouponType = 'percentage' | 'fixed';
export type CouponScopeType = 'global' | 'product' | 'category';

export interface DiscountRuleJson {
  type: DiscountType;
  discountType: 'percentage' | 'fixed';
  amount: number;
  productIds?: string[];
  minimumTotal?: number;
  categoryIds?: string[];
  customerIds?: string[];
  tierIds?: string[];
  membershipLevel?: string;
  dayOfWeek?: number[];
  timeRange?: { start: string; end: string };
  validFrom?: string;
  validTo?: string;
  buyProductId?: string;
  buyQuantity?: number;
  getProductId?: string;
  getQuantity?: number;
  getDiscountPercent?: number;
  quantityProductId?: string;
  tiers: Array<{ minQuantity: number; discountPercent: number }>;
}
