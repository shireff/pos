import { Coupon } from '@packages/domain-promotions';
import { CouponRepository } from '../../ports';

export interface ValidateCouponInput {
  code: string;
  companyId: string;
  cartTotalPiasters: number;
  customerId?: string | null;
  lineItems?: Array<{
    productId: string;
    categoryId: string | null;
    productVariantId: string;
  }>;
}

export interface ValidateCouponOutput {
  valid: boolean;
  couponId: string | null;
  discountAmountPiasters: number;
  reason?: string;
}

export class ValidateCouponCommand {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(input: ValidateCouponInput): Promise<ValidateCouponOutput> {
    const coupon = await this.couponRepo.findByCode(input.code, input.companyId);
    if (!coupon) {
      return { valid: false, couponId: null, discountAmountPiasters: 0, reason: 'Coupon not found' };
    }

    if (!coupon.isValid()) {
      return { valid: false, couponId: coupon.id, discountAmountPiasters: 0, reason: 'Coupon is expired or exhausted' };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round(input.cartTotalPiasters * (coupon.amount / 100));
    } else {
      discountAmount = Math.min(coupon.amount, input.cartTotalPiasters);
    }

    if (coupon.scopeType === 'product' && input.lineItems && input.lineItems.length > 0) {
      const scopedItems = input.lineItems.filter((l) => coupon.scopeIds.includes(l.productId || l.productVariantId));
      if (scopedItems.length === 0) {
        return { valid: false, couponId: coupon.id, discountAmountPiasters: 0, reason: 'No items in scope' };
      }
    }

    if (coupon.scopeType === 'category' && input.lineItems && input.lineItems.length > 0) {
      const scopedItems = input.lineItems.filter((l) => l.categoryId && coupon.scopeIds.includes(l.categoryId));
      if (scopedItems.length === 0) {
        return { valid: false, couponId: coupon.id, discountAmountPiasters: 0, reason: 'No items in scope' };
      }
    }

    return {
      valid: true,
      couponId: coupon.id,
      discountAmountPiasters: discountAmount,
    };
  }
}
