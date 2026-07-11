import { Identifier } from '@packages/shared-kernel';
import { CustomerStatus, LoyaltyTier } from '../value-objects';

export interface CustomerProps {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string | null;
  loyaltyCode: string;
  loyaltyTierId: LoyaltyTier;
  creditLimitPiasters: number;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Customer {
  public readonly id: string;
  public readonly companyId: string;
  public readonly phone: string;
  public name: string;
  public email: string | null;
  public readonly loyaltyCode: string;
  public loyaltyTierId: LoyaltyTier;
  public creditLimitPiasters: number;
  public status: CustomerStatus;
  public notes: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: CustomerProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.phone = props.phone;
    this.name = props.name;
    this.email = props.email;
    this.loyaltyCode = props.loyaltyCode;
    this.loyaltyTierId = props.loyaltyTierId;
    this.creditLimitPiasters = props.creditLimitPiasters;
    this.status = props.status;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    companyId: string;
    name: string;
    phone: string;
    email?: string | null;
    creditLimitPiasters?: number;
    notes?: string | null;
  }): Customer {
    const now = new Date().toISOString();
    const loyaltyCode = this.generateLoyaltyCode();
    return new Customer({
      id: Identifier.generate(),
      companyId: props.companyId,
      name: props.name,
      phone: props.phone,
      email: props.email ?? null,
      loyaltyCode,
      loyaltyTierId: 'bronze',
      creditLimitPiasters: props.creditLimitPiasters ?? 0,
      status: CustomerStatus.Active,
      notes: props.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: CustomerProps): Customer {
    const c = new Customer(props);
    c._updatedAt = props.updatedAt;
    return c;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  public static generateLoyaltyCode(): string {
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LOY-${segment()}-${segment()}`;
  }

  public updateProfile(updates: {
    name?: string;
    phone?: string;
    email?: string | null;
    creditLimitPiasters?: number;
    notes?: string | null;
  }): void {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.email !== undefined) this.email = updates.email;
    if (updates.creditLimitPiasters !== undefined) this.creditLimitPiasters = updates.creditLimitPiasters;
    if (updates.notes !== undefined) this.notes = updates.notes;
    this._updatedAt = new Date().toISOString();
  }

  public deactivate(): void {
    this.status = CustomerStatus.Inactive;
    this._updatedAt = new Date().toISOString();
  }

  public updateTier(tierId: LoyaltyTier): void {
    this.loyaltyTierId = tierId;
    this._updatedAt = new Date().toISOString();
  }
}
