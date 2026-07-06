import { Identifier } from '@packages/shared-kernel';
import { StockEventType, TransferStatus } from '../value-objects';
import { StockTransferLine, StockTransferLineProps } from '../entities';

// ─── StockMovementEvent (append-only, Class A) ────────────────────────────────

export interface StockMovementEventProps {
  id: string;
  warehouseId: string;
  productVariantId: string;
  batchId: string | null;
  eventType: StockEventType;
  quantityDelta: number; // positive = stock in, negative = stock out
  occurredAt: string; // ISO UTC
  originatingDeviceId: string;
  sequenceNo: number;
  causalityVector: Record<string, number>;
  referenceType: string | null; // 'Order' | 'StockTransfer' | 'PurchaseOrder' | null
  referenceId: string | null;
  correctionForEventId: string | null; // set when eventType = 'CORRECTION'
}

/** Immutable stock movement event. Never updated after creation. */
export class StockMovementEvent {
  public readonly id: string;
  public readonly warehouseId: string;
  public readonly productVariantId: string;
  public readonly batchId: string | null;
  public readonly eventType: StockEventType;
  public readonly quantityDelta: number;
  public readonly occurredAt: string;
  public readonly originatingDeviceId: string;
  public readonly sequenceNo: number;
  public readonly causalityVector: Readonly<Record<string, number>>;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly correctionForEventId: string | null;

  private constructor(props: StockMovementEventProps) {
    this.id = props.id;
    this.warehouseId = props.warehouseId;
    this.productVariantId = props.productVariantId;
    this.batchId = props.batchId;
    this.eventType = props.eventType;
    this.quantityDelta = props.quantityDelta;
    this.occurredAt = props.occurredAt;
    this.originatingDeviceId = props.originatingDeviceId;
    this.sequenceNo = props.sequenceNo;
    this.causalityVector = Object.freeze({ ...props.causalityVector });
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.correctionForEventId = props.correctionForEventId;
  }

  public static record(props: Omit<StockMovementEventProps, 'id'>): StockMovementEvent {
    return new StockMovementEvent({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: StockMovementEventProps): StockMovementEvent {
    return new StockMovementEvent(props);
  }

  /**
   * Creates a correction event that reverses this event's quantity delta.
   * The original event is never mutated.
   */
  public createCorrection(
    originatingDeviceId: string,
    sequenceNo: number,
    causalityVector: Record<string, number>,
  ): StockMovementEvent {
    return StockMovementEvent.record({
      warehouseId: this.warehouseId,
      productVariantId: this.productVariantId,
      batchId: this.batchId,
      eventType: 'CORRECTION',
      quantityDelta: -this.quantityDelta,
      occurredAt: new Date().toISOString(),
      originatingDeviceId,
      sequenceNo,
      causalityVector,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      correctionForEventId: this.id,
    });
  }
}

// ─── StockItem (projection — never source of truth) ───────────────────────────

export interface StockItemProps {
  id: string;
  warehouseId: string;
  productVariantId: string;
  batchId: string | null;
  quantityOnHand: number; // projection — sum of applicable events
  reorderPoint: number;
  updatedFromSequence: number;
}

export class StockItem {
  public readonly id: string;
  public readonly warehouseId: string;
  public readonly productVariantId: string;
  public readonly batchId: string | null;
  private _quantityOnHand: number;
  private _reorderPoint: number;
  private _updatedFromSequence: number;

  private constructor(props: StockItemProps) {
    this.id = props.id;
    this.warehouseId = props.warehouseId;
    this.productVariantId = props.productVariantId;
    this.batchId = props.batchId;
    this._quantityOnHand = props.quantityOnHand;
    this._reorderPoint = props.reorderPoint;
    this._updatedFromSequence = props.updatedFromSequence;
  }

  public static create(
    props: Omit<StockItemProps, 'id' | 'quantityOnHand' | 'updatedFromSequence'>,
  ): StockItem {
    return new StockItem({
      id: Identifier.generate(),
      quantityOnHand: 0,
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
  public get reorderPoint(): number {
    return this._reorderPoint;
  }
  public get updatedFromSequence(): number {
    return this._updatedFromSequence;
  }

  public applyEvent(event: StockMovementEvent): void {
    this._quantityOnHand += event.quantityDelta;
    if (event.sequenceNo > this._updatedFromSequence) {
      this._updatedFromSequence = event.sequenceNo;
    }
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
}

// ─── StockTransfer ───────────────────────────────────────────────────────────

export interface StockTransferProps {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  requestedByUserId: string;
  approvedByUserId: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export class StockTransfer {
  public readonly id: string;
  public readonly fromWarehouseId: string;
  public readonly toWarehouseId: string;
  private _status: TransferStatus;
  public readonly requestedByUserId: string;
  private _approvedByUserId: string | null;
  private _shippedAt: string | null;
  private _receivedAt: string | null;
  private _cancelledAt: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _isDeleted: boolean;
  private _lines: StockTransferLine[] = [];

  private constructor(props: StockTransferProps) {
    this.id = props.id;
    this.fromWarehouseId = props.fromWarehouseId;
    this.toWarehouseId = props.toWarehouseId;
    this._status = props.status;
    this.requestedByUserId = props.requestedByUserId;
    this._approvedByUserId = props.approvedByUserId;
    this._shippedAt = props.shippedAt;
    this._receivedAt = props.receivedAt;
    this._cancelledAt = props.cancelledAt;
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
      status: 'requested',
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
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get lines(): readonly StockTransferLine[] {
    return this._lines;
  }

  public addLine(productVariantId: string, quantityRequested: number): StockTransferLine {
    if (this._status !== 'requested')
      throw new Error('Cannot add lines after transfer is approved');
    const line = StockTransferLine.create({
      transferId: this.id,
      productVariantId,
      quantityRequested,
    });
    this._lines.push(line);
    return line;
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'requested')
      throw new Error(`Cannot approve transfer in status "${this._status}"`);
    this._status = 'approved';
    this._approvedByUserId = approvedByUserId;
    this._updatedAt = new Date().toISOString();
  }

  public ship(): void {
    if (this._status !== 'approved')
      throw new Error(`Cannot ship transfer in status "${this._status}"`);
    this._status = 'shipped';
    this._shippedAt = new Date().toISOString();
    this._updatedAt = this._shippedAt;
  }

  public receive(
    lineReceipts: Array<{ productVariantId: string; quantityReceived: number }>,
  ): void {
    if (this._status !== 'shipped')
      throw new Error(`Cannot receive transfer in status "${this._status}"`);
    for (const receipt of lineReceipts) {
      const line = this._lines.find((l) => l.productVariantId === receipt.productVariantId);
      if (line) line.recordReceived(receipt.quantityReceived);
    }
    this._status = 'received';
    this._receivedAt = new Date().toISOString();
    this._updatedAt = this._receivedAt;
  }

  public cancel(): void {
    if (this._status === 'shipped' || this._status === 'received')
      throw new Error(`Cannot cancel transfer in status "${this._status}"`);
    this._status = 'cancelled';
    this._cancelledAt = new Date().toISOString();
    this._updatedAt = this._cancelledAt;
  }
}
