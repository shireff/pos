import { Identifier } from '@packages/shared-kernel';
import { CouponType } from '../value-objects';

export interface CouponProps {
  id: string;
  companyId: string;
  code: string;
  type: CouponType;
  valuePiasters: number; // for 'fixed'; percentage value × 100 for 'percentage'
  maxUsageCount: number | null; // null = unlimited
  usageCount: number;
  expiresAt: string | null;
  scopeProductIds: string[];
  scopeCategoryIds: string[];
  scopeCustomerIds: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export class Coupon {
  public readonly id: string;
  public readonly companyId: string;
  public readonly code: string;
  public readonly type: CouponType;
  public readonly valuePiasters: number;
  public readonly maxUsageCount: number | null;
  private _usageCount: number;
  public readonly expiresAt: string | null;
  public readonly scopeProductIds: readonly string[];
  public readonly scopeCategoryIds: readonly string[];
  public readonly scopeCustomerIds: readonly string[];
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;

  private constructor(props: CouponProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.code = props.code;
    this.type = props.type;
    this.valuePiasters = props.valuePiasters;
    this.maxUsageCount = props.maxUsageCount;
    this._usageCount = props.usageCount;
    this.expiresAt = props.expiresAt;
    this.scopeProductIds = Object.freeze([...props.scopeProductIds]);
    this.scopeCategoryIds = Object.freeze([...props.scopeCategoryIds]);
    this.scopeCustomerIds = Object.freeze([...props.scopeCustomerIds]);
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
  }

  public static create(
    props: Omit<CouponProps, 'id' | 'usageCount' | 'isDeleted' | 'createdAt'>,
  ): Coupon {
    return new Coupon({
      id: Identifier.generate(),
      usageCount: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  public get usageCount(): number {
    return this._usageCount;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public isValid(asOf: Date = new Date()): boolean {
    if (!this._isActive || this._isDeleted) return false;
    if (this.expiresAt && new Date(this.expiresAt) < asOf) return false;
    if (this.maxUsageCount !== null && this._usageCount >= this.maxUsageCount) return false;
    return true;
  }

  public recordUsage(): void {
    if (!this.isValid()) throw new Error('Coupon is not valid');
    this._usageCount += 1;
  }

  public deactivate(): void {
    this._isActive = false;
  }
  public archive(): void {
    this._isDeleted = true;
  }
}
