import { Identifier } from '@packages/shared-kernel';
import { OrderStatus, TenderType } from '../value-objects';
import { OrderLine, OrderLineProps, Payment, PaymentProps, Return, ReturnProps } from '../entities';

export interface OrderProps {
  id: string;
  clientTxnId: string; // client-generated, used for idempotency
  branchId: string;
  cashierId: string;
  customerId: string | null;
  status: OrderStatus;
  subtotalPiasters: number;
  discountTotalPiasters: number;
  taxTotalPiasters: number;
  grandTotalPiasters: number;
  createdAt: string;
  updatedAt: string;
}

export class Order {
  public readonly id: string;
  public readonly clientTxnId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly customerId: string | null;
  private _status: OrderStatus;
  public readonly subtotalPiasters: number;
  public readonly discountTotalPiasters: number;
  public readonly taxTotalPiasters: number;
  public readonly grandTotalPiasters: number;
  public readonly createdAt: string;
  private _updatedAt: string;

  private _lines: OrderLine[] = [];
  private _payments: Payment[] = [];
  private _returns: Return[] = [];

  private constructor(props: OrderProps) {
    if (props.grandTotalPiasters < 0) throw new Error('Order grandTotal cannot be negative');
    this.id = props.id;
    this.clientTxnId = props.clientTxnId;
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.customerId = props.customerId;
    this._status = props.status;
    this.subtotalPiasters = props.subtotalPiasters;
    this.discountTotalPiasters = props.discountTotalPiasters;
    this.taxTotalPiasters = props.taxTotalPiasters;
    this.grandTotalPiasters = props.grandTotalPiasters;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static complete(
    props: Omit<OrderProps, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      lines: Omit<OrderLineProps, 'id' | 'orderId'>[];
      payments: Omit<PaymentProps, 'id' | 'orderId'>[];
    },
  ): Order {
    const now = new Date().toISOString();
    const orderId = Identifier.generate();

    // Validate tender sum equals grand total
    const tenderSum = props.payments.reduce((s, p) => s + p.amountPiasters, 0);
    if (tenderSum !== props.grandTotalPiasters)
      throw new Error(
        `Tender sum (${tenderSum}) must equal grand total (${props.grandTotalPiasters})`,
      );

    const order = new Order({
      id: orderId,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
      branchId: props.branchId,
      cashierId: props.cashierId,
      customerId: props.customerId,
      clientTxnId: props.clientTxnId,
      subtotalPiasters: props.subtotalPiasters,
      discountTotalPiasters: props.discountTotalPiasters,
      taxTotalPiasters: props.taxTotalPiasters,
      grandTotalPiasters: props.grandTotalPiasters,
    });

    order._lines = props.lines.map((l) => OrderLine.create({ ...l, orderId }));
    order._payments = props.payments.map((p) =>
      Payment.create({ ...p, orderId, tenderType: p.tenderType as TenderType }),
    );
    return order;
  }

  public static reconstitute(
    props: OrderProps,
    lines: OrderLineProps[],
    payments: PaymentProps[],
    returns: ReturnProps[],
  ): Order {
    const o = new Order(props);
    o._lines = lines.map((l) => OrderLine.reconstitute(l));
    o._payments = payments.map((p) => Payment.reconstitute(p));
    o._returns = returns.map((r) => Return.reconstitute(r));
    return o;
  }

  public get status(): OrderStatus {
    return this._status;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get lines(): readonly OrderLine[] {
    return this._lines;
  }
  public get payments(): readonly Payment[] {
    return this._payments;
  }
  public get returns(): readonly Return[] {
    return this._returns;
  }

  public void(reason: string): void {
    if (this._status !== 'completed')
      throw new Error(`Cannot void an order in status "${this._status}"`);
    void reason; // reason logged upstream in command handler
    this._status = 'voided';
    this._updatedAt = new Date().toISOString();
  }

  public addReturn(returnEntity: Return): void {
    this._returns.push(returnEntity);
    const totalReturned = this._returns
      .filter((r) => r.status === 'approved')
      .reduce((s, r) => s + r.refundAmountPiasters, 0);
    this._status =
      totalReturned >= this.grandTotalPiasters ? 'fully_returned' : 'partially_returned';
    this._updatedAt = new Date().toISOString();
  }
}
