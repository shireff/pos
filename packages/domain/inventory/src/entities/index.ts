import { Identifier } from '@packages/shared-kernel';

export interface BatchProps {
  id: string;
  companyId: string;
  productId: string;
  variantId: string | null;
  warehouseId: string;
  batchNumber: string;
  expiryDate: string | null;
  manufacturingDate: string | null;
  costPrice: number;
  quantityRemaining: number;
  isDeleted: boolean;
}

export class Batch {
  public readonly id: string;
  public readonly companyId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly warehouseId: string;
  public readonly batchNumber: string;
  public readonly expiryDate: string | null;
  public readonly manufacturingDate: string | null;
  private _costPrice: number;
  private _quantityRemaining: number;
  private _isDeleted: boolean;

  private constructor(props: BatchProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.warehouseId = props.warehouseId;
    this.batchNumber = props.batchNumber;
    this.expiryDate = props.expiryDate;
    this.manufacturingDate = props.manufacturingDate;
    this._costPrice = props.costPrice;
    this._quantityRemaining = props.quantityRemaining;
    this._isDeleted = props.isDeleted;
  }

  public static create(props: Omit<BatchProps, 'id' | 'isDeleted'>): Batch {
    return new Batch({ id: Identifier.generate(), isDeleted: false, ...props });
  }

  public static reconstitute(props: BatchProps): Batch {
    return new Batch(props);
  }

  public get costPrice(): number {
    return this._costPrice;
  }

  public get quantityRemaining(): number {
    return this._quantityRemaining;
  }

  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public isExpired(asOfDate: Date = new Date()): boolean {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < asOfDate;
  }

  public deduct(quantity: number): void {
    if (quantity <= 0) throw new Error('Deduction quantity must be positive');
    if (this._quantityRemaining < quantity) {
      throw new Error(`Insufficient batch quantity: requested ${quantity}, available ${this._quantityRemaining}`);
    }
    this._quantityRemaining -= quantity;
  }

  public archive(): void {
    this._isDeleted = true;
  }
}

export interface WarehouseProps {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  managerId: string | null;
  isDeleted: boolean;
}

export class Warehouse {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _address: string | null;
  public readonly isDefault: boolean;
  public readonly isActive: boolean;
  private _managerId: string | null;
  private _isDeleted: boolean;

  private constructor(props: WarehouseProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._address = props.address;
    this.isDefault = props.isDefault;
    this.isActive = props.isActive;
    this._managerId = props.managerId;
    this._isDeleted = props.isDeleted;
  }

  public static create(props: Omit<WarehouseProps, 'id' | 'isDeleted'>): Warehouse {
    return new Warehouse({ id: Identifier.generate(), isDeleted: false, ...props });
  }

  public static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  public get name(): string {
    return this._name;
  }

  public get address(): string | null {
    return this._address;
  }

  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public get managerId(): string | null {
    return this._managerId;
  }

  public rename(name: string): void {
    this._name = name;
  }

  public updateAddress(address: string | null): void {
    this._address = address;
  }

  public updateManager(managerId: string | null): void {
    this._managerId = managerId;
  }

  public archive(): void {
    this._isDeleted = true;
  }
}

export interface StockTransferLineProps {
  id: string;
  transferId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  notes: string | null;
}

export class StockTransferLine {
  public readonly id: string;
  public readonly transferId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly batchId: string | null;
  public readonly quantityRequested: number;
  private _quantityShipped: number;
  private _quantityReceived: number;
  private _notes: string | null;

  private constructor(props: StockTransferLineProps) {
    this.id = props.id;
    this.transferId = props.transferId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.batchId = props.batchId;
    this.quantityRequested = props.quantityRequested;
    this._quantityShipped = props.quantityShipped;
    this._quantityReceived = props.quantityReceived;
    this._notes = props.notes;
  }

  public static create(
    props: Omit<StockTransferLineProps, 'id' | 'quantityShipped' | 'quantityReceived' | 'notes'>,
  ): StockTransferLine {
    return new StockTransferLine({
      id: Identifier.generate(),
      quantityShipped: 0,
      quantityReceived: 0,
      notes: null,
      ...props,
    });
  }

  public static reconstitute(props: StockTransferLineProps): StockTransferLine {
    return new StockTransferLine(props);
  }

  public get quantityShipped(): number {
    return this._quantityShipped;
  }

  public get quantityReceived(): number {
    return this._quantityReceived;
  }

  public get notes(): string | null {
    return this._notes;
  }

  public get discrepancy(): number {
    return this.quantityRequested - this._quantityReceived;
  }

  public ship(quantity: number): void {
    if (quantity <= 0) throw new Error('Shipped quantity must be positive');
    if (quantity > this.quantityRequested) throw new Error('Shipped quantity exceeds requested');
    this._quantityShipped = quantity;
  }

  public receive(quantity: number): void {
    if (quantity < 0) throw new Error('Received quantity cannot be negative');
    if (quantity > this.quantityRequested) throw new Error('Received quantity exceeds requested');
    this._quantityReceived = quantity;
  }

  public addNotes(notes: string): void {
    this._notes = notes;
  }
}
