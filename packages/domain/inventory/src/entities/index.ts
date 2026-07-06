import { Identifier } from '@packages/shared-kernel';

// ─── Batch ───────────────────────────────────────────────────────────────────

export interface BatchProps {
  id: string;
  productVariantId: string;
  warehouseId: string;
  batchNumber: string;
  manufacturedAt: string | null; // ISO UTC
  expiresAt: string | null; // ISO UTC
  isDeleted: boolean;
}

export class Batch {
  public readonly id: string;
  public readonly productVariantId: string;
  public readonly warehouseId: string;
  public readonly batchNumber: string;
  public readonly manufacturedAt: string | null;
  public readonly expiresAt: string | null;
  private _isDeleted: boolean;

  private constructor(props: BatchProps) {
    this.id = props.id;
    this.productVariantId = props.productVariantId;
    this.warehouseId = props.warehouseId;
    this.batchNumber = props.batchNumber;
    this.manufacturedAt = props.manufacturedAt;
    this.expiresAt = props.expiresAt;
    this._isDeleted = props.isDeleted;
  }

  public static create(props: Omit<BatchProps, 'id' | 'isDeleted'>): Batch {
    return new Batch({ id: Identifier.generate(), isDeleted: false, ...props });
  }

  public static reconstitute(props: BatchProps): Batch {
    return new Batch(props);
  }

  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public isExpired(asOfDate: Date = new Date()): boolean {
    if (!this.expiresAt) return false;
    return new Date(this.expiresAt) < asOfDate;
  }

  public archive(): void {
    this._isDeleted = true;
  }
}

// ─── Warehouse ───────────────────────────────────────────────────────────────

export interface WarehouseProps {
  id: string;
  companyId: string;
  branchId: string | null;
  name: string;
  isCentral: boolean;
  isDeleted: boolean;
}

export class Warehouse {
  public readonly id: string;
  public readonly companyId: string;
  public readonly branchId: string | null;
  private _name: string;
  public readonly isCentral: boolean;
  private _isDeleted: boolean;

  private constructor(props: WarehouseProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this._name = props.name;
    this.isCentral = props.isCentral;
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
  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public rename(name: string): void {
    this._name = name;
  }
  public archive(): void {
    this._isDeleted = true;
  }
}

// ─── StockTransferLine ───────────────────────────────────────────────────────

export interface StockTransferLineProps {
  id: string;
  transferId: string;
  productVariantId: string;
  quantityRequested: number;
  quantityReceived: number | null;
}

export class StockTransferLine {
  public readonly id: string;
  public readonly transferId: string;
  public readonly productVariantId: string;
  public readonly quantityRequested: number;
  private _quantityReceived: number | null;

  private constructor(props: StockTransferLineProps) {
    this.id = props.id;
    this.transferId = props.transferId;
    this.productVariantId = props.productVariantId;
    this.quantityRequested = props.quantityRequested;
    this._quantityReceived = props.quantityReceived;
  }

  public static create(
    props: Omit<StockTransferLineProps, 'id' | 'quantityReceived'>,
  ): StockTransferLine {
    return new StockTransferLine({ id: Identifier.generate(), quantityReceived: null, ...props });
  }

  public static reconstitute(props: StockTransferLineProps): StockTransferLine {
    return new StockTransferLine(props);
  }

  public get quantityReceived(): number | null {
    return this._quantityReceived;
  }

  public recordReceived(qty: number): void {
    if (qty < 0) throw new Error('Received quantity cannot be negative');
    this._quantityReceived = qty;
  }

  public get discrepancy(): number | null {
    if (this._quantityReceived === null) return null;
    return this.quantityRequested - this._quantityReceived;
  }
}
