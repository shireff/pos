import { Identifier } from '@packages/shared-kernel';
import {
  PurchaseOrderStatus,
  RECEIVED_STATUSES,
  TERMINAL_STATUSES,
  DiscrepancyType,
} from '../value-objects';
import {
  PurchaseOrderLine,
  PurchaseOrderLineProps,
  SupplierInvoice,
} from '../entities';

export interface PurchaseOrderProps {
  id: string;
  companyId: string;
  branchId: string;
  supplierId: string;
  referenceNumber: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string;
  notes: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  rejectedReason: string | null;
  cancelledReason: string | null;
  totalAmountPiasters: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLineProps {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  productId: string;
  variantId: string | null;
  warehouseId: string;
  receivedQuantity: number;
  discrepancyType: DiscrepancyType | null;
  discrepancyNotes: string | null;
}

export interface GoodsReceiptDiscrepancyProps {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  type: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  notes: string;
}

export class PurchaseOrder {
  public readonly id: string;
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly supplierId: string;
  private _referenceNumber: string;
  private _status: PurchaseOrderStatus;
  private _expectedDeliveryDate: string;
  private _notes: string | null;
  public readonly requestedByUserId: string;
  private _approvedByUserId: string | null;
  private _rejectedReason: string | null;
  private _cancelledReason: string | null;
  private _totalAmountPiasters: number;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _lines: PurchaseOrderLine[] = [];

  private constructor(props: PurchaseOrderProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.supplierId = props.supplierId;
    this._referenceNumber = props.referenceNumber;
    this._status = props.status;
    this._expectedDeliveryDate = props.expectedDeliveryDate;
    this._notes = props.notes;
    this.requestedByUserId = props.requestedByUserId;
    this._approvedByUserId = props.approvedByUserId;
    this._rejectedReason = props.rejectedReason;
    this._cancelledReason = props.cancelledReason;
    this._totalAmountPiasters = props.totalAmountPiasters;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<
      PurchaseOrderProps,
      | 'id'
      | 'referenceNumber'
      | 'status'
      | 'approvedByUserId'
      | 'rejectedReason'
      | 'cancelledReason'
      | 'totalAmountPiasters'
      | 'createdAt'
      | 'updatedAt'
      | 'notes'
    >,
    referenceNumber?: string,
  ): PurchaseOrder {
    const now = new Date().toISOString();
    return new PurchaseOrder({
      id: Identifier.generate(),
      referenceNumber: referenceNumber ?? PurchaseOrder.generateReference(),
      status: 'draft',
      approvedByUserId: null,
      rejectedReason: null,
      cancelledReason: null,
      totalAmountPiasters: 0,
      notes: null,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(
    props: PurchaseOrderProps,
    lines: PurchaseOrderLineProps[],
  ): PurchaseOrder {
    const po = new PurchaseOrder(props);
    po._lines = lines.map((l) => PurchaseOrderLine.reconstitute(l));
    po.recomputeTotal();
    return po;
  }

  public static generateReference(): string {
    const now = new Date();
    const y = now.getUTCFullYear();
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `PO-${y}-${rand}`;
  }

  public get status(): PurchaseOrderStatus {
    return this._status;
  }
  public get referenceNumber(): string {
    return this._referenceNumber;
  }
  public get expectedDeliveryDate(): string {
    return this._expectedDeliveryDate;
  }
  public get notes(): string | null {
    return this._notes;
  }
  public get approvedByUserId(): string | null {
    return this._approvedByUserId;
  }
  public get rejectedReason(): string | null {
    return this._rejectedReason;
  }
  public get cancelledReason(): string | null {
    return this._cancelledReason;
  }
  public get totalAmountPiasters(): number {
    return this._totalAmountPiasters;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get lines(): readonly PurchaseOrderLine[] {
    return this._lines;
  }

  public addLine(
    productId: string,
    variantId: string | null,
    unitId: string,
    orderedQuantity: number,
    unitPricePiasters: number,
  ): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add lines after PO is submitted');
    }
    this._lines.push(
      PurchaseOrderLine.create({
        purchaseOrderId: this.id,
        productId,
        variantId,
        unitId,
        orderedQuantity,
        unitPricePiasters,
      }),
    );
    this.recomputeTotal();
    this._updatedAt = new Date().toISOString();
  }

  public updateLine(
    lineId: string,
    orderedQuantity: number,
    unitPricePiasters: number,
  ): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot update lines after PO is submitted');
    }
    const line = this._lines.find((l) => l.id === lineId);
    if (!line) throw new Error('Purchase order line not found');
    line.update(orderedQuantity, unitPricePiasters);
    this.recomputeTotal();
    this._updatedAt = new Date().toISOString();
  }

  public updateHeader(
    fields: Partial<Pick<PurchaseOrderProps, 'expectedDeliveryDate' | 'notes'>>,
  ): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot update header after PO is submitted');
    }
    if (fields.expectedDeliveryDate !== undefined) {
      this._expectedDeliveryDate = fields.expectedDeliveryDate;
    }
    if (fields.notes !== undefined) {
      this._notes = fields.notes;
    }
    this._updatedAt = new Date().toISOString();
  }

  public submit(autoApproveThresholdPiasters: number): void {
    if (this._status !== 'draft') {
      throw new Error(`Cannot submit PO in status "${this._status}"`);
    }
    if (this._lines.length === 0) {
      throw new Error('Cannot submit a purchase order with no lines');
    }
    if (this._totalAmountPiasters <= autoApproveThresholdPiasters) {
      this._status = 'approved';
    } else {
      this._status = 'pending_approval';
    }
    this._updatedAt = new Date().toISOString();
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'pending_approval') {
      throw new Error(`Cannot approve PO in status "${this._status}"`);
    }
    this._status = 'approved';
    this._approvedByUserId = approvedByUserId;
    this._rejectedReason = null;
    this._updatedAt = new Date().toISOString();
  }

  public reject(reason: string): void {
    if (this._status !== 'pending_approval') {
      throw new Error(`Cannot reject PO in status "${this._status}"`);
    }
    if (reason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }
    this._status = 'draft';
    this._rejectedReason = reason;
    this._updatedAt = new Date().toISOString();
  }

  public cancel(reason: string): void {
    if (TERMINAL_STATUSES.has(this._status) || RECEIVED_STATUSES.has(this._status)) {
      throw new Error(`Cannot cancel a PO in status "${this._status}"`);
    }
    this._status = 'cancelled';
    this._cancelledReason = reason;
    this._updatedAt = new Date().toISOString();
  }

  public receive(
    lineReceipts: Array<{ lineId: string; quantityReceived: number }>,
  ): void {
    if (this._status !== 'approved' && this._status !== 'partially_received') {
      throw new Error(`Cannot receive goods for PO in status "${this._status}"`);
    }

    for (const receipt of lineReceipts) {
      const line = this._lines.find((l) => l.id === receipt.lineId);
      if (!line) throw new Error(`Purchase order line not found: ${receipt.lineId}`);
      line.recordReceived(receipt.quantityReceived);
    }

    const allReceived = this._lines.every((l) => l.isFullyReceived);
    this._status = allReceived ? 'fully_received' : 'partially_received';
    this._updatedAt = new Date().toISOString();
  }

  public hasDiscrepancy(): boolean {
    return this._lines.some((l) => l.discrepancy !== 0);
  }

  private recomputeTotal(): void {
    this._totalAmountPiasters = this._lines.reduce(
      (sum, l) => sum + l.lineTotalPiasters,
      0,
    );
  }
}

// ─── GoodsReceipt aggregate ────────────────────────────────────────────────────

export class GoodsReceipt {
  public readonly id: string;
  public readonly companyId: string;
  public readonly purchaseOrderId: string;
  public readonly receivedByUserId: string;
  public readonly receivedAt: string;
  public readonly notes: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _lines: GoodsReceiptLineProps[] = [];
  private _discrepancies: GoodsReceiptDiscrepancyProps[] = [];

  private constructor(
    props: {
      id: string;
      companyId: string;
      purchaseOrderId: string;
      receivedByUserId: string;
      receivedAt: string;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    },
  ) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.purchaseOrderId = props.purchaseOrderId;
    this.receivedByUserId = props.receivedByUserId;
    this.receivedAt = props.receivedAt;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    companyId: string;
    purchaseOrderId: string;
    receivedByUserId: string;
    notes?: string | null;
  }): GoodsReceipt {
    const now = new Date().toISOString();
    return new GoodsReceipt({
      id: Identifier.generate(),
      companyId: props.companyId,
      purchaseOrderId: props.purchaseOrderId,
      receivedByUserId: props.receivedByUserId,
      receivedAt: now,
      notes: props.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(
    props: {
      id: string;
      companyId: string;
      purchaseOrderId: string;
      receivedByUserId: string;
      receivedAt: string;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    },
    lines: GoodsReceiptLineProps[],
    discrepancies: GoodsReceiptDiscrepancyProps[],
  ): GoodsReceipt {
    const gr = new GoodsReceipt(props);
    gr._lines = lines;
    gr._discrepancies = discrepancies;
    return gr;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get lines(): readonly GoodsReceiptLineProps[] {
    return this._lines;
  }
  public get discrepancies(): readonly GoodsReceiptDiscrepancyProps[] {
    return this._discrepancies;
  }

  public addLine(line: GoodsReceiptLineProps): void {
    this._lines.push(line);
    this._updatedAt = new Date().toISOString();
  }

  public addDiscrepancy(discrepancy: GoodsReceiptDiscrepancyProps): void {
    this._discrepancies.push(discrepancy);
    this._updatedAt = new Date().toISOString();
  }
}
