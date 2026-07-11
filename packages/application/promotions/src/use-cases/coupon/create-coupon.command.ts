import { Coupon } from '@packages/domain-promotions';
import { CouponRepository } from '../../ports';

export interface CreateCouponInput {
  companyId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  amount: number;
  isMultiUse?: boolean;
  usageLimit?: number | null;
  expiresAt?: string | null;
  scopeType: 'global' | 'product' | 'category';
  scopeIds: string[];
}

export class CreateCouponCommand {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(input: CreateCouponInput): Promise<Coupon> {
    const existing = await this.couponRepo.findByCode(input.code, input.companyId);
    if (existing) throw new Error(`Coupon with code "${input.code}" already exists`);

    const coupon = Coupon.create({
      companyId: input.companyId,
      code: input.code,
      discountType: input.discountType,
      amount: input.amount,
      isMultiUse: input.isMultiUse ?? false,
      usageLimit: input.usageLimit ?? null,
      expiresAt: input.expiresAt ?? null,
      scopeType: input.scopeType,
      scopeIds: input.scopeIds,
      isActive: true,
    });

    await this.couponRepo.save(coupon);
    return coupon;
  }
}
