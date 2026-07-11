import { Result } from '@packages/shared-kernel';
import { Discount } from '../aggregates';
import { DiscountRuleJson } from '../value-objects';

export interface LineItem {
  productVariantId: string;
  categoryId: string | null;
  productId: string | null;
  quantity: number;
  unitPricePiasters: number;
}

export interface CartContext {
  lines: LineItem[];
  customerId: string | null;
  customerTierIds: string[];
  membershipLevel: string | null;
  currentDateTime: Date;
}

export interface DiscountApplicationResult {
  lineIndex: number;
  ruleId: string;
  ruleName: string;
  discountAmountPiasters: number;
  exclusive: boolean;
}

/**
 * DiscountEngine evaluates rule_json-driven discounts against a cart context.
 * Adding a new discount type requires only new rule_json config — no code change (BR-PRC-002).
 */
export class DiscountEngine {
  public static applyToLine(
    rule: DiscountRuleJson,
    line: LineItem,
    cart: CartContext,
  ): Result<number, string> {
    if (!this.isRuleApplicable(rule, line, cart)) return Result.ok(0);

    const lineSubtotal = line.unitPricePiasters * line.quantity;

    switch (rule.type) {
      case 'item': {
        if (rule.productIds && rule.productIds.length > 0) {
          if (!line.productId || !rule.productIds.includes(line.productId)) return Result.ok(0);
        }
        const discount = this.calculateAmount(rule.discountType, rule.amount, lineSubtotal);
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'category': {
        const discount = this.calculateAmount(rule.discountType, rule.amount, lineSubtotal);
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'customer': {
        const discount = this.calculateAmount(rule.discountType, rule.amount, lineSubtotal);
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'membership': {
        if (rule.membershipLevel && cart.membershipLevel !== rule.membershipLevel) return Result.ok(0);
        const discount = this.calculateAmount(rule.discountType, rule.amount, lineSubtotal);
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'time_based': {
        if (!this.isTimeBasedApplicable(rule, cart.currentDateTime)) return Result.ok(0);
        const discount = this.calculateAmount(rule.discountType, rule.amount, lineSubtotal);
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'buy_x_get_y': {
        if (!rule.buyQuantity || !rule.getQuantity || !rule.getDiscountPercent) return Result.ok(0);
        if (line.quantity < rule.buyQuantity) return Result.ok(0);
        const freeUnits = Math.floor(line.quantity / rule.buyQuantity) * rule.getQuantity;
        const discount = Math.min(
          Math.round(lineSubtotal * (rule.getDiscountPercent / 100)),
          freeUnits * line.unitPricePiasters,
        );
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'quantity_break': {
        if (!rule.tiers || rule.tiers.length === 0) return Result.ok(0);
        const applicableTier = [...rule.tiers]
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find((t) => line.quantity >= t.minQuantity);
        if (!applicableTier) return Result.ok(0);
        const discount = Math.round(lineSubtotal * (applicableTier.discountPercent / 100));
        return Result.ok(this.guardNotExceedSubtotal(discount, lineSubtotal));
      }
      case 'cart':
        return Result.ok(0);
      default:
        return Result.ok(0);
    }
  }

  public static applyCartDiscount(rule: DiscountRuleJson, cartSubtotal: number): Result<number, string> {
    if (rule.type !== 'cart') return Result.ok(0);
    if (rule.minimumTotal && cartSubtotal < rule.minimumTotal) return Result.ok(0);
    if (rule.customerIds && rule.customerIds.length > 0) return Result.ok(0);
    const discount = this.calculateAmount(rule.discountType, rule.amount, cartSubtotal);
    return Result.ok(this.guardNotExceedSubtotal(discount, cartSubtotal));
  }

  public static isRuleApplicable(
    rule: DiscountRuleJson,
    line: LineItem,
    cart: CartContext,
  ): boolean {
    if (rule.validFrom && new Date(rule.validFrom) > cart.currentDateTime) return false;
    if (rule.validTo && new Date(rule.validTo) < cart.currentDateTime) return false;
    if (rule.categoryIds && rule.categoryIds.length > 0) {
      if (!line.categoryId || !rule.categoryIds.includes(line.categoryId)) return false;
    }
    if (rule.membershipLevel && cart.membershipLevel !== rule.membershipLevel) return false;
    if (rule.customerIds && rule.customerIds.length > 0) {
      if (!cart.customerId || !rule.customerIds.includes(cart.customerId)) return false;
    }
    if (rule.tierIds && rule.tierIds.length > 0) {
      if (!cart.customerTierIds.some((t) => rule.tierIds!.includes(t))) return false;
    }
    if (rule.productIds && rule.productIds.length > 0) {
      if (!line.productId || !rule.productIds.includes(line.productId)) return false;
    }
    return true;
  }

  public static isTimeBasedApplicable(rule: DiscountRuleJson, currentDateTime: Date): boolean {
    if (rule.validFrom && new Date(rule.validFrom) > currentDateTime) return false;
    if (rule.validTo && new Date(rule.validTo) < currentDateTime) return false;
    if (rule.dayOfWeek && rule.dayOfWeek.length > 0) {
      if (!rule.dayOfWeek.includes(currentDateTime.getUTCDay())) return false;
    }
    if (rule.timeRange) {
      const currentMinutes = currentDateTime.getUTCHours() * 60 + currentDateTime.getUTCMinutes();
      const [startH, startM] = rule.timeRange.start.split(':').map(Number);
      const [endH, endM] = rule.timeRange.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
    }
    return true;
  }

  public static evaluateCartDiscounts(
    discounts: Discount[],
    cartSubtotal: number,
    cart: CartContext,
  ): Array<{ ruleId: string; name: string; discountAmountPiasters: number; exclusive: boolean }> {
    const applicable = discounts
      .filter((d) => d.isActive && !d.isDeleted)
      .sort((a, b) => a.priority - b.priority);

    const results: Array<{ ruleId: string; name: string; discountAmountPiasters: number; exclusive: boolean }> = [];
    let hitExclusive = false;
    let remainingSubtotal = cartSubtotal;

    for (const discount of applicable) {
      if (hitExclusive) break;
      const rule = discount.ruleJson;
      if (remainingSubtotal <= 0) break;

      const cartDiscount = this.applyCartDiscount(rule, remainingSubtotal);
      if (cartDiscount.isOk()) {
        const amount = cartDiscount.getValue();
        if (amount > 0) {
          results.push({
            ruleId: discount.id,
            name: discount.name,
            discountAmountPiasters: amount,
            exclusive: discount.isExclusive,
          });
          remainingSubtotal -= amount;
          if (discount.isExclusive) hitExclusive = true;
        }
      }
    }

    return results;
  }

  public static evaluateLineItemDiscounts(
    discounts: Discount[],
    cart: CartContext,
  ): Map<number, Array<{ ruleId: string; name: string; discountAmountPiasters: number; exclusive: boolean }>> {
    const applicable = discounts
      .filter((d) => d.isActive && !d.isDeleted)
      .sort((a, b) => a.priority - b.priority);

    const results = new Map<number, Array<{ ruleId: string; name: string; discountAmountPiasters: number; exclusive: boolean }>>();

    for (const discount of applicable) {
      const rule = discount.ruleJson;
      for (let i = 0; i < cart.lines.length; i++) {
        const line = cart.lines[i];
        if (rule.type === 'cart') continue;

        const lineDiscounts = results.get(i) ?? [];
        if (lineDiscounts.some((d) => d.exclusive)) continue;

        const result = this.applyToLine(rule, line, cart);
         if (result.isOk() && result.getValue() > 0) {
          lineDiscounts.push({
            ruleId: discount.id,
            name: discount.name,
            discountAmountPiasters: result.getValue(),
            exclusive: discount.isExclusive,
          });
          results.set(i, lineDiscounts);
        }
      }
    }

    return results;
  }

  public static validateDiscount(
    discountAmountPiasters: number,
    lineSubtotalPiasters: number,
  ): Result<void, string> {
    if (discountAmountPiasters > lineSubtotalPiasters) {
      return Result.fail('Discount amount cannot exceed the line subtotal');
    }
    return Result.ok(undefined);
  }

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

  private static calculateAmount(discountType: string, amount: number, subtotal: number): number {
    if (discountType === 'percentage') {
      return Math.round(subtotal * (amount / 100));
    }
    return Math.min(amount, subtotal);
  }

  private static guardNotExceedSubtotal(discount: number, subtotal: number): number {
    return Math.max(0, Math.min(discount, subtotal));
  }
}
