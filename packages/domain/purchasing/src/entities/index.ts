import { Identifier } from '@packages/shared-kernel';

// ─── PurchaseOrderLine ────────────────────────────────────────────────────────

export interface PurchaseOrderLineProps {
  id: string;
  purchaseOrderId: string;
  productVariantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostPiasters: number;
}

export class PurchaseOrderLine {
  public readonly id: string;
  public readonly purchaseOrderId: string;
  public readonly productVariantId: string;
  public readonly quantityOrdered: number;
  private _quantityReceived: number;
  public readonly unitCostPiasters: number;

  private constructor(props: PurchaseOrderLineProps) {
    if (props.quantityOrdered <= 0) throw new Error('PO line quantity must be positive');
    this.id = props.id;
    this.purchaseOrderId = props.purchaseOrderId;
    this.productVariantId = props.productVariantId;
    this.quantityOrdered = props.quantityOrdered;
    this._quantityReceived = props.quantityReceived;
    this.unitCostPiasters = props.unitCostPiasters;
  }

  public static create(
    props: Omit<PurchaseOrderLineProps, 'id' | 'quantityReceived'>,
  ): PurchaseOrderLine {
    return new PurchaseOrderLine({ id: Identifier.generate(), quantityReceived: 0, ...props });
  }

  public static reconstitute(props: PurchaseOrderLineProps): PurchaseOrderLine {
    return new PurchaseOrderLine(props);
  }

  public get quantityReceived(): number {
    return this._quantityReceived;
  }
  public get discrepancy(): number {
    return this.quantityOrdered - this._quantityReceived;
  }

  public recordReceived(qty: number): void {
    if (qty < 0) throw new Error('Received quantity cannot be negative');
    this._quantityReceived = qty;
  }
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface SupplierProps {
  id: string;
  companyId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Supplier {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _phone: string | null;
  private _email: string | null;
  private _address: string | null;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: SupplierProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._phone = props.phone;
    this._email = props.email;
    this._address = props.address;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<SupplierProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Supplier {
    const now = new Date().toISOString();
    return new Supplier({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  public get name(): string {
    return this._name;
  }
  public get phone(): string | null {
    return this._phone;
  }
  public get email(): string | null {
    return this._email;
  }
  public get address(): string | null {
    return this._address;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public update(
    fields: Partial<Pick<SupplierProps, 'name' | 'phone' | 'email' | 'address'>>,
  ): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.phone !== undefined) this._phone = fields.phone;
    if (fields.email !== undefined) this._email = fields.email;
    if (fields.address !== undefined) this._address = fields.address;
    this._updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}
