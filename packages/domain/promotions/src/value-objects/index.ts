export type DiscountType =
  | 'item'
  | 'cart'
  | 'category'
  | 'customer_specific'
  | 'membership'
  | 'time_based'
  | 'buy_x_get_y'
  | 'quantity_break';

export type CouponType = 'percentage' | 'fixed';

/** Rule JSON stored in discounts.rule_json — drives the rule engine without code changes. */
export interface DiscountRuleJson {
  type: DiscountType;
  value: number; // percentage (0–100) or fixed piasters
  minQuantity?: number; // for quantity_break and buy_x_get_y
  freeQuantity?: number; // for buy_x_get_y
  validFrom?: string; // ISO UTC — for time_based
  validTo?: string; // ISO UTC — for time_based
  categoryIds?: string[]; // for category scoping
  membershipTiers?: string[]; // for membership discounts
  customerIds?: string[]; // for customer_specific
}
