import { Identifier } from '@packages/shared-kernel';
import { DiscountRuleJson, DiscountType } from '../value-objects';

export interface DiscountProps {
  id: string;
  companyId: string;
  name: string;
  discountType: DiscountType;
  ruleJson: DiscountRuleJson;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Discount {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  public readonly discountType: DiscountType;
  private _ruleJson: DiscountRuleJson;
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: DiscountProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this.discountType = props.discountType;
    this._ruleJson = { ...props.ruleJson };
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<DiscountProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Discount {
    const now = new Date().toISOString();
    return new Discount({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: DiscountProps): Discount {
    return new Discount(props);
  }

  public get name(): string {
    return this._name;
  }
  public get ruleJson(): DiscountRuleJson {
    return { ...this._ruleJson };
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

  public update(fields: Partial<Pick<DiscountProps, 'name' | 'ruleJson'>>): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.ruleJson !== undefined) this._ruleJson = { ...fields.ruleJson };
    this._updatedAt = new Date().toISOString();
  }

  public activate(): void {
    this._isActive = true;
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
