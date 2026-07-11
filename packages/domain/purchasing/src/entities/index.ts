import { Identifier } from '@packages/shared-kernel';
import { SupplierInvoiceStatus } from '../value-objects';

// ─── PurchaseOrderLine ───────────────────────────────────────────────────────

export interface PurchaseOrderLineProps {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string | null;
  unitId: string;
  orderedQuantity: number;
  unitPricePiasters: number;
  receivedQuantity: number;
}

export class PurchaseOrderLine {
  public readonly id: string;
  public readonly purchaseOrderId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly unitId: string;
  private _orderedQuantity: number;
  private _unitPricePiasters: number;
  private _receivedQuantity: number;

  private constructor(props: PurchaseOrderLineProps) {
    if (props.orderedQuantity <= 0) throw new Error('PO line ordered quantity must be positive');
    if (props.unitPricePiasters < 0) throw new Error('PO line unit price cannot be negative');
    this.id = props.id;
    this.purchaseOrderId = props.purchaseOrderId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.unitId = props.unitId;
    this._orderedQuantity = props.orderedQuantity;
    this._unitPricePiasters = props.unitPricePiasters;
    this._receivedQuantity = props.receivedQuantity;
  }

  public static create(
    props: Omit<PurchaseOrderLineProps, 'id' | 'receivedQuantity'>,
  ): PurchaseOrderLine {
    return new PurchaseOrderLine({
      id: Identifier.generate(),
      receivedQuantity: 0,
      ...props,
    });
  }

  public static reconstitute(props: PurchaseOrderLineProps): PurchaseOrderLine {
    return new PurchaseOrderLine(props);
  }

  public get orderedQuantity(): number {
    return this._orderedQuantity;
  }
  public get unitPricePiasters(): number {
    return this._unitPricePiasters;
  }
  public get receivedQuantity(): number {
    return this._receivedQuantity;
  }
  public get lineTotalPiasters(): number {
    return this._orderedQuantity * this._unitPricePiasters;
  }
  public get discrepancy(): number {
    return this._orderedQuantity - this._receivedQuantity;
  }
  public get isFullyReceived(): boolean {
    return this._receivedQuantity >= this._orderedQuantity;
  }

  public recordReceived(quantity: number): void {
    if (quantity < 0) throw new Error('Received quantity cannot be negative');
    if (quantity > this._orderedQuantity) {
      throw new Error('Received quantity cannot exceed ordered quantity');
    }
    this._receivedQuantity = quantity;
  }

  public update(orderedQuantity: number, unitPricePiasters: number): void {
    if (orderedQuantity <= 0) throw new Error('PO line ordered quantity must be positive');
    if (unitPricePiasters < 0) throw new Error('PO line unit price cannot be negative');
    if (orderedQuantity < this._receivedQuantity) {
      throw new Error('Ordered quantity cannot be less than received quantity');
    }
    this._orderedQuantity = orderedQuantity;
    this._unitPricePiasters = unitPricePiasters;
  }
}

// ─── SupplierInvoice ─────────────────────────────────────────────────────────

export interface SupplierInvoiceProps {
  id: string;
  companyId: string;
  purchaseOrderId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmountPiasters: number;
  taxAmountPiasters: number;
  attachmentUrl: string | null;
  status: SupplierInvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export class SupplierInvoice {
  public readonly id: string;
  public readonly companyId: string;
  public readonly purchaseOrderId: string;
  public readonly supplierId: string;
  private _invoiceNumber: string;
  private _invoiceDate: string;
  private _totalAmountPiasters: number;
  private _taxAmountPiasters: number;
  private _attachmentUrl: string | null;
  private _status: SupplierInvoiceStatus;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: SupplierInvoiceProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.purchaseOrderId = props.purchaseOrderId;
    this.supplierId = props.supplierId;
    this._invoiceNumber = props.invoiceNumber;
    this._invoiceDate = props.invoiceDate;
    this._totalAmountPiasters = props.totalAmountPiasters;
    this._taxAmountPiasters = props.taxAmountPiasters;
    this._attachmentUrl = props.attachmentUrl;
    this._status = props.status;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<
      SupplierInvoiceProps,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >,
  ): SupplierInvoice {
    const now = new Date().toISOString();
    return new SupplierInvoice({
      id: Identifier.generate(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: SupplierInvoiceProps): SupplierInvoice {
    return new SupplierInvoice(props);
  }

  public get invoiceNumber(): string {
    return this._invoiceNumber;
  }
  public get invoiceDate(): string {
    return this._invoiceDate;
  }
  public get totalAmountPiasters(): number {
    return this._totalAmountPiasters;
  }
  public get taxAmountPiasters(): number {
    return this._taxAmountPiasters;
  }
  public get attachmentUrl(): string | null {
    return this._attachmentUrl;
  }
  public get status(): SupplierInvoiceStatus {
    return this._status;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public markMatched(): void {
    this._status = 'matched';
    this._updatedAt = new Date().toISOString();
  }

  public markDisputed(): void {
    this._status = 'disputed';
    this._updatedAt = new Date().toISOString();
  }
}

export { SupplierLedgerEntry } from './supplier-ledger-entry.entity';
export { SupplierPriceHistory } from './supplier-price-history.entity';
