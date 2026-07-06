import { Identifier } from '@packages/shared-kernel';
import { PurchaseOrderStatus } from '../value-objects';
import { PurchaseOrderLine, PurchaseOrderLineProps } from '../entities';

export interface PurchaseOrderProps {
  id: string;
  companyId: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  requestedByUserId: string;
  approvedByUserId: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PurchaseOrder {
  public readonly id: string;
  public readonly companyId: string;
  public readonly supplierId: string;
  private _status: PurchaseOrderStatus;
  public readonly requestedByUserId: string;
  private _approvedByUserId: string | null;
  private _receivedAt: string | null;
  private _cancelledAt: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _lines: PurchaseOrderLine[] = [];

  private constructor(props: PurchaseOrderProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.supplierId = props.supplierId;
    this._status = props.status;
    this.requestedByUserId = props.requestedByUserId;
    this._approvedByUserId = props.approvedByUserId;
    this._receivedAt = props.receivedAt;
    this._cancelledAt = props.cancelledAt;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<
      PurchaseOrderProps,
      | 'id'
      | 'status'
      | 'approvedByUserId'
      | 'receivedAt'
      | 'cancelledAt'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): PurchaseOrder {
    const now = new Date().toISOString();
    return new PurchaseOrder({
      id: Identifier.generate(),
      status: 'draft',
      approvedByUserId: null,
      receivedAt: null,
      cancelledAt: null,
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
    return po;
  }

  public get status(): PurchaseOrderStatus {
    return this._status;
  }
  public get approvedByUserId(): string | null {
    return this._approvedByUserId;
  }
  public get receivedAt(): string | null {
    return this._receivedAt;
  }
  public get cancelledAt(): string | null {
    return this._cancelledAt;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get lines(): readonly PurchaseOrderLine[] {
    return this._lines;
  }

  public addLine(
    productVariantId: string,
    quantityOrdered: number,
    unitCostPiasters: number,
  ): void {
    if (this._status !== 'draft') throw new Error('Cannot add lines after PO is submitted');
    this._lines.push(
      PurchaseOrderLine.create({
        purchaseOrderId: this.id,
        productVariantId,
        quantityOrdered,
        unitCostPiasters,
      }),
    );
    this._updatedAt = new Date().toISOString();
  }

  public submit(): void {
    if (this._status !== 'draft') throw new Error(`Cannot submit PO in status "${this._status}"`);
    this._status = 'pending_approval';
    this._updatedAt = new Date().toISOString();
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'pending_approval')
      throw new Error(`Cannot approve PO in status "${this._status}"`);
    this._status = 'approved';
    this._approvedByUserId = approvedByUserId;
    this._updatedAt = new Date().toISOString();
  }

  public receive(
    lineReceipts: Array<{ productVariantId: string; quantityReceived: number }>,
  ): void {
    if (this._status !== 'approved')
      throw new Error(`Cannot receive PO in status "${this._status}"`);
    for (const receipt of lineReceipts) {
      const line = this._lines.find((l) => l.productVariantId === receipt.productVariantId);
      if (line) line.recordReceived(receipt.quantityReceived);
    }
    this._status = 'received';
    this._receivedAt = new Date().toISOString();
    this._updatedAt = this._receivedAt;
  }

  public cancel(): void {
    if (this._status === 'received') throw new Error('Cannot cancel a received PO');
    this._status = 'cancelled';
    this._cancelledAt = new Date().toISOString();
    this._updatedAt = this._cancelledAt;
  }
}
