import { Identifier } from '@packages/shared-kernel';

export interface CustomerProps {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  loyaltyCode: string;
  creditLimitPiasters: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Customer {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _phone: string;
  public readonly loyaltyCode: string;
  private _creditLimitPiasters: number;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: CustomerProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._phone = props.phone;
    this.loyaltyCode = props.loyaltyCode;
    this._creditLimitPiasters = props.creditLimitPiasters;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<CustomerProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'loyaltyCode'>,
  ): Customer {
    const now = new Date().toISOString();
    const loyaltyCode = `C${Date.now().toString(36).toUpperCase()}`;
    return new Customer({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      loyaltyCode,
      ...props,
    });
  }

  public static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  public get name(): string {
    return this._name;
  }
  public get phone(): string {
    return this._phone;
  }
  public get creditLimitPiasters(): number {
    return this._creditLimitPiasters;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public update(
    fields: Partial<Pick<CustomerProps, 'name' | 'phone' | 'creditLimitPiasters'>>,
  ): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.phone !== undefined) this._phone = fields.phone;
    if (fields.creditLimitPiasters !== undefined)
      this._creditLimitPiasters = fields.creditLimitPiasters;
    this._updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}
