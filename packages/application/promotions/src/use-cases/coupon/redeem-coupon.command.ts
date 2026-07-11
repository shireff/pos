import { Coupon } from '@packages/domain-promotions';
import { CouponRepository } from '../../ports';

export interface RedeemCouponInput {
  couponId: string;
  companyId: string;
  orderId: string;
  usedByUserId: string;
}

export class RedeemCouponCommand {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(input: RedeemCouponInput): Promise<Coupon> {
    const coupon = await this.couponRepo.findById(input.couponId, input.companyId);
    if (!coupon) throw new Error(`Coupon with id "${input.couponId}" not found`);

    coupon.recordUsage();
    await this.couponRepo.save(coupon);
    return coupon;
  }
}
