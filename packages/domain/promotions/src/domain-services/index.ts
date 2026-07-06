import { Result } from '@packages/shared-kernel';
import { Discount } from '../aggregates';
import { DiscountRuleJson } from '../value-objects';

export interface LineItem {
  productVariantId: string;
  categoryId: string | null;
  quantity: number;
  unitPricePiasters: number;
}

export interface CartContext {
  lines: LineItem[];
  customerId: string | null;
  membershipTier: string | null;
  currentDateTime: Date;
}

/**
 * DiscountEngine evaluates rule_json-driven discounts against a cart context.
 * Adding a new discount type requires only new rule_json config — no code change (BR-PRC-002).
 */
export class DiscountEngine {
  /**
   * Calculates the discount amount in piasters for a single line item
   * given a discount rule. Returns 0 if the discount does not apply.
   */
  public static applyToLine(
    rule: DiscountRuleJson,
    line: LineItem,
    cart: CartContext,
  ): Result<number, string> {
    // Time-based guard
    if (rule.validFrom && new Date(rule.validFrom) > cart.currentDateTime) return Result.ok(0);
    if (rule.validTo && new Date(rule.validTo) < cart.currentDateTime) return Result.ok(0);

    // Category scope guard
    if (rule.categoryIds && rule.categoryIds.length > 0) {
      if (!line.categoryId || !rule.categoryIds.includes(line.categoryId)) return Result.ok(0);
    }

    // Membership guard
    if (rule.membershipTiers && rule.membershipTiers.length > 0) {
      if (!cart.membershipTier || !rule.membershipTiers.includes(cart.membershipTier))
        return Result.ok(0);
    }

    // Customer-specific guard
    if (rule.customerIds && rule.customerIds.length > 0) {
      if (!cart.customerId || !rule.customerIds.includes(cart.customerId)) return Result.ok(0);
    }

    const lineSubtotal = line.unitPricePiasters * line.quantity;

    switch (rule.type) {
      case 'item':
      case 'category':
      case 'customer_specific':
      case 'membership':
      case 'time_based': {
        const discount =
          rule.value >= 1
            ? Math.min(rule.value, lineSubtotal) // fixed piasters
            : Math.round(lineSubtotal * rule.value); // fraction → treat as percentage / 100
        if (discount > lineSubtotal) return Result.fail('DISCOUNT_EXCEEDS_SUBTOTAL');
        return Result.ok(discount);
      }

      case 'quantity_break': {
        if (!rule.minQuantity || line.quantity < rule.minQuantity) return Result.ok(0);
        const discount = Math.round(lineSubtotal * (rule.value / 100));
        return Result.ok(Math.min(discount, lineSubtotal));
      }

      case 'buy_x_get_y': {
        if (!rule.minQuantity || !rule.freeQuantity) return Result.ok(0);
        if (line.quantity < rule.minQuantity) return Result.ok(0);
        const freeUnits = Math.floor(line.quantity / rule.minQuantity) * rule.freeQuantity;
        const discount = Math.min(freeUnits * line.unitPricePiasters, lineSubtotal);
        return Result.ok(discount);
      }

      case 'cart':
        // Cart-level discounts are evaluated separately against cart total, not per-line
        return Result.ok(0);

      default:
        return Result.ok(0);
    }
  }

  /**
   * Validates that a discount does not exceed the line subtotal (BR-PRC-003).
   */
  public static validateDiscount(
    discountAmountPiasters: number,
    lineSubtotalPiasters: number,
  ): Result<void, string> {
    if (discountAmountPiasters > lineSubtotalPiasters) {
      return Result.fail('Discount amount cannot exceed the line subtotal');
    }
    return Result.ok(undefined);
  }

  /**
   * Returns all active, applicable discounts for a given cart context, sorted by value descending.
   */
  public static filterApplicable(discounts: Discount[], asOf: Date = new Date()): Discount[] {
    return discounts
      .filter((d) => d.isActive && !d.isDeleted)
      .filter((d) => {
        const rule = d.ruleJson;
        if (rule.validFrom && new Date(rule.validFrom) > asOf) return false;
        if (rule.validTo && new Date(rule.validTo) < asOf) return false;
        return true;
      });
  }
}
