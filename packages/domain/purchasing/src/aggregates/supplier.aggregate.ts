import { Identifier } from '@packages/shared-kernel';
import { SupplierContact } from '../value-objects/supplier-contact.vo';

export interface SupplierProps {
  id: string;
  companyId: string;
  name: { ar: string; en?: string };
  phone: string;
  email: string | null;
  address: string | null;
  taxId: string | null;
  paymentTermsDays: number;
  currency: string;
  isActive: boolean;
  contacts: SupplierContact[];
  createdAt: string;
  updatedAt: string;
}

export class Supplier {
  public readonly id: string;
  public readonly companyId: string;
  public readonly createdAt: string;
  private _name: { ar: string; en?: string };
  private _phone: string;
  private _email: string | null;
  private _address: string | null;
  private _taxId: string | null;
  private _paymentTermsDays: number;
  private _currency: string;
  private _isActive: boolean;
  private _contacts: SupplierContact[];
  private _updatedAt: string;

  private constructor(props: SupplierProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._phone = props.phone;
    this._email = props.email;
    this._address = props.address;
    this._taxId = props.taxId;
    this._paymentTermsDays = props.paymentTermsDays;
    this._currency = props.currency;
    this._isActive = props.isActive;
    this._contacts = props.contacts;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    companyId: string;
    name: { ar: string; en?: string };
    phone: string;
    email?: string | null;
    address?: string | null;
    taxId?: string | null;
    paymentTermsDays?: number;
    currency?: string;
    contacts?: SupplierContact[];
  }): Supplier {
    const now = new Date().toISOString();
    return new Supplier({
      id: Identifier.generate(),
      companyId: props.companyId,
      name: props.name,
      phone: props.phone,
      email: props.email ?? null,
      address: props.address ?? null,
      taxId: props.taxId ?? null,
      paymentTermsDays: props.paymentTermsDays ?? 0,
      currency: props.currency ?? 'EGP',
      isActive: true,
      contacts: props.contacts ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: SupplierProps): Supplier {
    const s = new Supplier(props);
    s._updatedAt = props.updatedAt;
    return s;
  }

  public get name(): { ar: string; en?: string } {
    return this._name;
  }

  public get phone(): string {
    return this._phone;
  }

  public get email(): string | null {
    return this._email;
  }

  public get address(): string | null {
    return this._address;
  }

  public get taxId(): string | null {
    return this._taxId;
  }

  public get paymentTermsDays(): number {
    return this._paymentTermsDays;
  }

  public get currency(): string {
    return this._currency;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get contacts(): readonly SupplierContact[] {
    return this._contacts;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  public update(updates: {
    name?: { ar: string; en?: string };
    phone?: string;
    email?: string | null;
    address?: string | null;
    taxId?: string | null;
    paymentTermsDays?: number;
    currency?: string;
  }): void {
    if (updates.name !== undefined) this._name = updates.name;
    if (updates.phone !== undefined) this._phone = updates.phone;
    if (updates.email !== undefined) this._email = updates.email;
    if (updates.address !== undefined) this._address = updates.address;
    if (updates.taxId !== undefined) this._taxId = updates.taxId;
    if (updates.paymentTermsDays !== undefined) this._paymentTermsDays = updates.paymentTermsDays;
    if (updates.currency !== undefined) this._currency = updates.currency;
    this._updatedAt = new Date().toISOString();
  }

  public replaceContacts(contacts: SupplierContact[]): void {
    this._contacts = contacts;
    this._updatedAt = new Date().toISOString();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date().toISOString();
  }
}
