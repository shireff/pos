import { describe, it, expect } from 'vitest';
import { Discount } from './aggregates';
import { Coupon } from './entities';
import { DiscountEngine } from './domain-services';
import { DiscountRuleJson } from './value-objects';

const BASE_DISCOUNT_PROPS = {
  companyId: 'c1',
  name: 'Test Discount',
  type: 'item' as const,
  ruleJson: { type: 'item' as const, discountType: 'percentage' as const, amount: 10, tiers: [] },
  isActive: true,
  validFrom: null,
  validUntil: null,
  priority: 0,
  isExclusive: false,
  isDeleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Discount aggregate', () => {
  it('creates with generated id and timestamps', () => {
    const discount = Discount.create(BASE_DISCOUNT_PROPS);
    expect(discount.id).toBeTruthy();
    expect(discount.companyId).toBe('c1');
    expect(discount.type).toBe('item');
    expect(discount.isActive).toBe(true);
    expect(discount.priority).toBe(0);
    expect(discount.isExclusive).toBe(false);
  });

  it('reconstitutes from persisted props', () => {
    const discount = Discount.reconstitute({ id: 'd1', ...BASE_DISCOUNT_PROPS });
    expect(discount.id).toBe('d1');
  });

  it('activates and deactivate', () => {
    const discount = Discount.create(BASE_DISCOUNT_PROPS);
    discount.deactivate();
    expect(discount.isActive).toBe(false);
    discount.activate();
    expect(discount.isActive).toBe(true);
  });

  it('archives sets isDeleted', () => {
    const discount = Discount.create(BASE_DISCOUNT_PROPS);
    discount.archive();
    expect(discount.isDeleted).toBe(true);
  });

  it('update mutates mutable fields', () => {
    const discount = Discount.create(BASE_DISCOUNT_PROPS);
    const before = discount.updatedAt;
    discount.update({ name: 'Updated', priority: 5, isExclusive: true });
    expect(discount.name).toBe('Updated');
    expect(discount.priority).toBe(5);
    expect(discount.isExclusive).toBe(true);
    expect(discount.updatedAt).not.toBe(before);
  });
});

describe('Coupon entity', () => {
  const baseProps = {
    companyId: 'c1',
    code: 'SAVE10',
    discountType: 'percentage' as const,
    amount: 10,
    isMultiUse: false,
    usageLimit: 100,
    usageCount: 0,
    expiresAt: null,
    scopeType: 'global' as const,
    scopeIds: [] as string[],
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('creates with zero usage', () => {
    const coupon = Coupon.create(baseProps);
    expect(coupon.id).toBeTruthy();
    expect(coupon.usageCount).toBe(0);
    expect(coupon.isValid()).toBe(true);
  });

  it('isValid checks expiry and usage limit', () => {
    const expired = Coupon.create({ ...baseProps, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(expired.isValid()).toBe(false);

    const exhausted = Coupon.create({ ...baseProps, usageLimit: 1 });
    exhausted.recordUsage();
    expect(exhausted.isValid()).toBe(false);
  });

  it('recordUsage increments count and validates first', () => {
    const coupon = Coupon.create(baseProps);
    coupon.recordUsage();
    expect(coupon.usageCount).toBe(1);
    expect(() => Coupon.create({ ...baseProps, expiresAt: new Date(Date.now() - 1000).toISOString() }).recordUsage()).toThrow();
  });
});

describe('DiscountEngine', () => {
  function makeLine(overrides: Record<string, unknown> = {}): any {
    return {
      productVariantId: 'v1',
      categoryId: 'cat1',
      productId: 'p1',
      quantity: 2,
      unitPricePiasters: 5000,
      ...overrides,
    };
  }

  function makeCart(): any {
    return { lines: [], customerId: null, customerTierIds: [], membershipLevel: null, currentDateTime: new Date() };
  }

  it('applies percentage item discount to matching product', () => {
    const rule: DiscountRuleJson = { type: 'item', discountType: 'percentage', amount: 10, productIds: ['p1'], tiers: [] };
    const result = DiscountEngine.applyToLine(rule, makeLine(), makeCart());
    expect(result.isOk()).toBe(true);
    expect(result.getValue()).toBe(1000);
  });

  it('does not apply item discount when product does not match', () => {
    const rule: DiscountRuleJson = { type: 'item', discountType: 'percentage', amount: 10, productIds: ['p2'], tiers: [] };
    const result = DiscountEngine.applyToLine(rule, makeLine(), makeCart());
    expect(result.isOk()).toBe(true);
    expect(result.getValue()).toBe(0);
  });

  it('applies fixed discount capped at subtotal', () => {
    const rule: DiscountRuleJson = { type: 'item', discountType: 'fixed', amount: 20000, tiers: [] };
    const result = DiscountEngine.applyToLine(rule, makeLine(), makeCart());
    expect(result.getValue()).toBe(10000);
  });

  it('applies category discount regardless of specific product', () => {
    const rule: DiscountRuleJson = { type: 'category', discountType: 'percentage', amount: 20, categoryIds: ['cat1'], tiers: [] };
    const result = DiscountEngine.applyToLine(rule, makeLine(), makeCart());
    expect(result.getValue()).toBe(2000);
  });

  it('applies quantity break tier based on line quantity', () => {
    const rule: DiscountRuleJson = { type: 'quantity_break', discountType: 'percentage', amount: 0, tiers: [{ minQuantity: 5, discountPercent: 15 }] };
    const result = DiscountEngine.applyToLine(rule, makeLine({ quantity: 10 }), makeCart());
    expect(result.getValue()).toBe(7500);
  });

  it('filterApplicable respects date bounds', () => {
    const future = Discount.create({
      ...BASE_DISCOUNT_PROPS,
      ruleJson: { type: 'item', discountType: 'percentage', amount: 10, tiers: [], validFrom: new Date(Date.now() + 100000).toISOString() },
    });
    const discounts = DiscountEngine.filterApplicable([future]);
    expect(discounts).toHaveLength(0);
  });
});
