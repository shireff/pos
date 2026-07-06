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

// ─── Return ──────────────────────────────────────────────────────────────────

export interface ReturnProps {
  id: string;
  originalOrderId: string;
  reason: string;
  refundMethod: RefundMethod;
  status: ReturnStatus;
  refundAmountPiasters: number;
  createdAt: string;
  updatedAt: string;
}

export class Return {
  public readonly id: string;
  public readonly originalOrderId: string;
  public readonly reason: string;
  public readonly refundMethod: RefundMethod;
  private _status: ReturnStatus;
  public readonly refundAmountPiasters: number;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: ReturnProps) {
    this.id = props.id;
    this.originalOrderId = props.originalOrderId;
    this.reason = props.reason;
    this.refundMethod = props.refundMethod;
    this._status = props.status;
    this.refundAmountPiasters = props.refundAmountPiasters;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: Omit<ReturnProps, 'id' | 'createdAt' | 'updatedAt'>): Return {
    const now = new Date().toISOString();
    return new Return({ id: Identifier.generate(), createdAt: now, updatedAt: now, ...props });
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

  public approve(): void {
    if (this._status !== 'pending_approval') throw new Error('Return is not pending approval');
    this._status = 'approved';
    this._updatedAt = new Date().toISOString();
  }

  public reject(): void {
    if (this._status !== 'pending_approval') throw new Error('Return is not pending approval');
    this._status = 'rejected';
    this._updatedAt = new Date().toISOString();
  }
}
