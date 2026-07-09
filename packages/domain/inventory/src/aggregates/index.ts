import { Identifier } from '@packages/shared-kernel';
import { StockEventType, TransferStatus } from '../value-objects';
import { StockTransferLine, StockTransferLineProps } from '../entities';

export interface StockMovementEventProps {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  eventType: StockEventType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  occurredAt: string;
}

export class StockMovementEvent {
  public readonly id: string;
  public readonly companyId: string;
  public readonly warehouseId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly batchId: string | null;
  public readonly eventType: StockEventType;
  public readonly quantity: number;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly occurredAt: string;

  private constructor(props: StockMovementEventProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.warehouseId = props.warehouseId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.batchId = props.batchId;
    this.eventType = props.eventType;
    this.quantity = props.quantity;
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.occurredAt = props.occurredAt;
  }

  public static record(props: Omit<StockMovementEventProps, 'id'>): StockMovementEvent {
    return new StockMovementEvent({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: StockMovementEventProps): StockMovementEvent {
    return new StockMovementEvent(props);
  }
}

export interface StockItemProps {
  id: string;
  companyId: string;
  productId: string;
  variantId: string | null;
  warehouseId: string;
  batchId: string | null;
  quantityOnHand: number;
  reservedQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  updatedFromSequence: number;
}

export class StockItem {
  public readonly id: string;
  public readonly companyId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly warehouseId: string;
  public readonly batchId: string | null;
  private _quantityOnHand: number;
  private _reservedQuantity: number;
  private _reorderPoint: number;
  private _reorderQuantity: number;
  private _updatedFromSequence: number;

  private constructor(props: StockItemProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.warehouseId = props.warehouseId;
    this.batchId = props.batchId;
    this._quantityOnHand = props.quantityOnHand;
    this._reservedQuantity = props.reservedQuantity;
    this._reorderPoint = props.reorderPoint;
    this._reorderQuantity = props.reorderQuantity;
    this._updatedFromSequence = props.updatedFromSequence;
  }

  public static create(
    props: Omit<StockItemProps, 'id' | 'quantityOnHand' | 'reservedQuantity' | 'updatedFromSequence'>,
  ): StockItem {
    return new StockItem({
      id: Identifier.generate(),
      quantityOnHand: 0,
      reservedQuantity: 0,
      updatedFromSequence: 0,
      ...props,
    });
  }

  public static reconstitute(props: StockItemProps): StockItem {
    return new StockItem(props);
  }

  public get quantityOnHand(): number {
    return this._quantityOnHand;
  }

  public get reservedQuantity(): number {
    return this._reservedQuantity;
  }

  public get reorderPoint(): number {
    return this._reorderPoint;
  }

  public get reorderQuantity(): number {
    return this._reorderQuantity;
  }

  public get updatedFromSequence(): number {
    return this._updatedFromSequence;
  }

  public applyEvent(event: StockMovementEvent): void {
    this._quantityOnHand += event.quantity;
  }

  public reserve(quantity: number): void {
    if (quantity <= 0) throw new Error('Reserve quantity must be positive');
    if (this._quantityOnHand - this._reservedQuantity < quantity) {
      throw new Error('Insufficient available stock to reserve');
    }
    this._reservedQuantity += quantity;
  }

  public releaseReservation(quantity: number): void {
    if (quantity <= 0) throw new Error('Release quantity must be positive');
    this._reservedQuantity = Math.max(0, this._reservedQuantity - quantity);
  }

  public updateReorderPoint(reorderPoint: number): void {
    if (reorderPoint < 0) throw new Error('Reorder point cannot be negative');
    this._reorderPoint = reorderPoint;
  }

  public isBelowReorderPoint(): boolean {
    return this._quantityOnHand <= this._reorderPoint;
  }

  public isOutOfStock(): boolean {
    return this._quantityOnHand <= 0;
  }

  public availableQuantity(): number {
    return this._quantityOnHand - this._reservedQuantity;
  }
}

export interface StockTransferProps {
  id: string;
  companyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  requestedByUserId: string;
  approvedByUserId: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export class StockTransfer {
  public readonly id: string;
  public readonly companyId: string;
  public readonly fromWarehouseId: string;
  public readonly toWarehouseId: string;
  private _status: TransferStatus;
  public readonly requestedByUserId: string;
  private _approvedByUserId: string | null;
  private _shippedAt: string | null;
  private _receivedAt: string | null;
  private _cancelledAt: string | null;
  private _notes: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _isDeleted: boolean;
  private _lines: StockTransferLine[] = [];

  private constructor(props: StockTransferProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.fromWarehouseId = props.fromWarehouseId;
    this.toWarehouseId = props.toWarehouseId;
    this._status = props.status;
    this.requestedByUserId = props.requestedByUserId;
    this._approvedByUserId = props.approvedByUserId;
    this._shippedAt = props.shippedAt;
    this._receivedAt = props.receivedAt;
    this._cancelledAt = props.cancelledAt;
    this._notes = props.notes;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._isDeleted = props.isDeleted;
  }

  public static create(
    props: Omit<
      StockTransferProps,
      | 'id'
      | 'status'
      | 'approvedByUserId'
      | 'shippedAt'
      | 'receivedAt'
      | 'cancelledAt'
      | 'isDeleted'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): StockTransfer {
    const now = new Date().toISOString();
    return new StockTransfer({
      id: Identifier.generate(),
      status: 'draft',
      approvedByUserId: null,
      shippedAt: null,
      receivedAt: null,
      cancelledAt: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(
    props: StockTransferProps,
    lines: StockTransferLineProps[],
  ): StockTransfer {
    const t = new StockTransfer(props);
    t._lines = lines.map((l) => StockTransferLine.reconstitute(l));
    return t;
  }

  public get status(): TransferStatus {
    return this._status;
  }

  public get approvedByUserId(): string | null {
    return this._approvedByUserId;
  }

  public get shippedAt(): string | null {
    return this._shippedAt;
  }

  public get receivedAt(): string | null {
    return this._receivedAt;
  }

  public get cancelledAt(): string | null {
    return this._cancelledAt;
  }

  public get notes(): string | null {
    return this._notes;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public get lines(): readonly StockTransferLine[] {
    return this._lines;
  }

  public addLine(line: StockTransferLine): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add lines after transfer is submitted');
    }
    this._lines.push(line);
  }

  public submit(): void {
    if (this._status !== 'draft') {
      throw new Error(`Cannot submit transfer in status "${this._status}"`);
    }
    if (this._lines.length === 0) {
      throw new Error('Cannot submit transfer with no lines');
    }
    this._status = 'pending_approval';
    this._updatedAt = new Date().toISOString();
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'pending_approval') {
      throw new Error(`Cannot approve transfer in status "${this._status}"`);
    }
    this._status = 'approved';
    this._approvedByUserId = approvedByUserId;
    this._updatedAt = new Date().toISOString();
  }

  public ship(): void {
    if (this._status !== 'approved') {
      throw new Error(`Cannot ship transfer in status "${this._status}"`);
    }
    for (const line of this._lines) {
      if (line.quantityShipped <= 0) {
        throw new Error('All lines must have shipped quantities before shipping');
      }
    }
    this._status = 'shipped';
    this._shippedAt = new Date().toISOString();
    this._updatedAt = this._shippedAt;
  }

  public receive(lineReceipts: Array<{ lineId: string; quantityReceived: number }>): void {
    if (this._status !== 'shipped') {
      throw new Error(`Cannot receive transfer in status "${this._status}"`);
    }
    for (const receipt of lineReceipts) {
      const line = this._lines.find((l) => l.id === receipt.lineId);
      if (!line) continue;
      line.receive(receipt.quantityReceived);
    }
    this._status = 'received';
    this._receivedAt = new Date().toISOString();
    this._updatedAt = this._receivedAt;
  }

  public cancel(): void {
    if (this._status === 'shipped' || this._status === 'received') {
      throw new Error(`Cannot cancel transfer in status "${this._status}"`);
    }
    this._status = 'cancelled';
    this._cancelledAt = new Date().toISOString();
    this._updatedAt = this._cancelledAt;
  }
}
