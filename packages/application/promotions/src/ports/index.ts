import { Discount } from '@packages/domain-promotions';
import { Coupon } from '@packages/domain-promotions';

export interface DiscountRepository {
  findById(id: string, companyId: string): Promise<Discount | null>;
  findByCompany(companyId: string, type?: string, isActive?: boolean): Promise<Discount[]>;
  save(discount: Discount): Promise<void>;
}

export interface CouponRepository {
  findById(id: string, companyId: string): Promise<Coupon | null>;
  findByCompany(companyId: string): Promise<Coupon[]>;
  findByCode(code: string, companyId: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<void>;
}
