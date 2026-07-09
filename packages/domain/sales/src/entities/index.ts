import { Identifier } from '@packages/shared-kernel';
import { TenderType, ReturnStatus, RefundMethod } from '../value-objects';

// ─── OrderLine ───────────────────────────────────────────────────────────────

export interface OrderLineProps {
  id: string;
  orderId: string;
  productVariantId: string;
  batchId: string | null;
  quantity: number;
  unitPricePiasters: number;
  discountAmountPiasters: number;
  taxAmountPiasters: number;
  costSnapshotPiasters: number;
}

export class OrderLine {
  public readonly id: string;
  public readonly orderId: string;
  public readonly productVariantId: string;
  public readonly batchId: string | null;
  public readonly quantity: number;
  public readonly unitPricePiasters: number;
  public readonly discountAmountPiasters: number;
  public readonly taxAmountPiasters: number;
  public readonly costSnapshotPiasters: number;

  private constructor(props: OrderLineProps) {
    if (props.quantity <= 0) throw new Error('OrderLine quantity must be positive');
    this.id = props.id;
    this.orderId = props.orderId;
    this.productVariantId = props.productVariantId;
    this.batchId = props.batchId;
    this.quantity = props.quantity;
    this.unitPricePiasters = props.unitPricePiasters;
    this.discountAmountPiasters = props.discountAmountPiasters;
    this.taxAmountPiasters = props.taxAmountPiasters;
    this.costSnapshotPiasters = props.costSnapshotPiasters;
  }

  public static create(props: Omit<OrderLineProps, 'id'>): OrderLine {
    if (props.discountAmountPiasters > props.unitPricePiasters * props.quantity)
      throw new Error('Discount cannot exceed line subtotal');
    return new OrderLine({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: OrderLineProps): OrderLine {
    return new OrderLine(props);
  }

  public get lineTotalPiasters(): number {
    return (
      this.unitPricePiasters * this.quantity - this.discountAmountPiasters + this.taxAmountPiasters
    );
  }
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentProps {
  id: string;
  orderId: string;
  tenderType: TenderType;
  amountPiasters: number;
  providerReference: string | null;
}

export class Payment {
  public readonly id: string;
  public readonly orderId: string;
  public readonly tenderType: TenderType;
  public readonly amountPiasters: number;
  public readonly providerReference: string | null;

  private constructor(props: PaymentProps) {
    if (props.amountPiasters <= 0) throw new Error('Payment amount must be positive');
    this.id = props.id;
    this.orderId = props.orderId;
    this.tenderType = props.tenderType;
    this.amountPiasters = props.amountPiasters;
    this.providerReference = props.providerReference;
  }

  public static create(props: Omit<PaymentProps, 'id'>): Payment {
    return new Payment({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: PaymentProps): Payment {
    return new Payment(props);
  }
}

// ─── ReturnLine ──────────────────────────────────────────────────────────────

export interface ReturnLineProps {
  id: string;
  returnId: string;
  originalOrderLineId: string;
  productVariantId: string;
  batchId: string | null;
  quantity: number;
  refundAmountPiasters: number;
}

export class ReturnLine {
  public readonly id: string;
  public readonly returnId: string;
  public readonly originalOrderLineId: string;
  public readonly productVariantId: string;
  public readonly batchId: string | null;
  public readonly quantity: number;
  public readonly refundAmountPiasters: number;

  private constructor(props: ReturnLineProps) {
    if (props.quantity <= 0) throw new Error('ReturnLine quantity must be positive');
    this.id = props.id;
    this.returnId = props.returnId;
    this.originalOrderLineId = props.originalOrderLineId;
    this.productVariantId = props.productVariantId;
    this.batchId = props.batchId;
    this.quantity = props.quantity;
    this.refundAmountPiasters = props.refundAmountPiasters;
  }

  public static create(props: Omit<ReturnLineProps, 'id'>): ReturnLine {
    return new ReturnLine({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: ReturnLineProps): ReturnLine {
    return new ReturnLine(props);
  }
}

// ─── Return ──────────────────────────────────────────────────────────────────

export interface ReturnProps {
  id: string;
  originalOrderId: string;
  returnedByUserId: string;
  approvedByUserId: string | null;
  reason: string;
  refundMethod: RefundMethod;
  status: ReturnStatus;
  refundAmountPiasters: number;
  createdAt: string;
  updatedAt: string;
  lines: ReturnLineProps[];
  voidedOrderId?: string | null;
}

export class Return {
  public readonly id: string;
  public readonly originalOrderId: string;
  public readonly returnedByUserId: string;
  public approvedByUserId: string | null;
  public readonly reason: string;
  public readonly refundMethod: RefundMethod;
  private _status: ReturnStatus;
  public readonly refundAmountPiasters: number;
  public readonly createdAt: string;
  private _updatedAt: string;
  private _lines: ReturnLine[] = [];
  public readonly voidedOrderId: string | null;

  private constructor(props: ReturnProps) {
    this.id = props.id;
    this.originalOrderId = props.originalOrderId;
    this.returnedByUserId = props.returnedByUserId;
    this.approvedByUserId = props.approvedByUserId ?? null;
    this.reason = props.reason;
    this.refundMethod = props.refundMethod;
    this._status = props.status;
    this.refundAmountPiasters = props.refundAmountPiasters;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this.voidedOrderId = props.voidedOrderId ?? null;
    this._lines = props.lines.map((l) => ReturnLine.reconstitute(l));
  }

  public static create(
    props: Omit<ReturnProps, 'id' | 'createdAt' | 'updatedAt' | 'approvedByUserId' | 'lines'> & {
      lines?: ReturnLineProps[];
      approvedByUserId?: string | null;
    },
  ): Return {
    const now = new Date().toISOString();
    return new Return({
      ...props,
      lines: props.lines ?? [],
      approvedByUserId: props.approvedByUserId ?? null,
      id: Identifier.generate(),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ReturnProps): Return {
    return new Return(props);
  }

  public get status(): ReturnStatus {
    return this._status;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get lines(): readonly ReturnLine[] {
    return this._lines;
  }

  public addLine(line: ReturnLine): void {
    this._lines.push(line);
    this._updatedAt = new Date().toISOString();
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'pending_approval') throw new Error('Return is not pending approval');
    this._status = 'approved';
    this.approvedByUserId = approvedByUserId;
    this._updatedAt = new Date().toISOString();
  }

  public reject(): void {
    if (this._status !== 'pending_approval') throw new Error('Return is not pending approval');
    this._status = 'rejected';
    this._updatedAt = new Date().toISOString();
  }
}
