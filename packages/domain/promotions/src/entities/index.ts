import { Identifier } from '@packages/shared-kernel';
import { CouponScopeType, CouponType } from '../value-objects';

export interface CouponProps {
  id: string;
  companyId: string;
  code: string;
  discountType: CouponType;
  amount: number;
  isMultiUse: boolean;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  scopeType: CouponScopeType;
  scopeIds: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Coupon {
  public readonly id: string;
  public readonly companyId: string;
  public readonly code: string;
  public readonly discountType: CouponType;
  public readonly amount: number;
  public readonly isMultiUse: boolean;
  public readonly usageLimit: number | null;
  private _usageCount: number;
  public readonly expiresAt: string | null;
  public readonly scopeType: CouponScopeType;
  public readonly scopeIds: readonly string[];
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: CouponProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.code = props.code;
    this.discountType = props.discountType;
    this.amount = props.amount;
    this.isMultiUse = props.isMultiUse;
    this.usageLimit = props.usageLimit;
    this._usageCount = props.usageCount;
    this.expiresAt = props.expiresAt;
    this.scopeType = props.scopeType;
    this.scopeIds = Object.freeze([...props.scopeIds]);
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<CouponProps, 'id' | 'usageCount' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Coupon {
    return new Coupon({
      id: Identifier.generate(),
      usageCount: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public isValid(asOf: Date = new Date()): boolean {
    if (!this._isActive || this._isDeleted) return false;
    if (this.expiresAt && new Date(this.expiresAt) < asOf) return false;
    if (this.usageLimit !== null && this._usageCount >= this.usageLimit) return false;
    return true;
  }

  public recordUsage(): void {
    if (!this.isValid()) throw new Error('Coupon is not valid');
    this._usageCount += 1;
    this._updatedAt = new Date().toISOString();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }
  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}
