import { Identifier } from '@packages/shared-kernel';
import { OrderStatus, TenderType, ShiftStatus } from '../value-objects';
import {
  OrderLine,
  OrderLineProps,
  Payment,
  PaymentProps,
  Return,
  ReturnProps,
  ReturnLine,
  ReturnLineProps,
} from '../entities';

export interface OrderProps {
  id: string;
  companyId: string;
  branchId: string;
  cashierId: string;
  customerId: string | null;
  clientTxnId: string; // client-generated, used for idempotency
  shiftSessionId: string | null;
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
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly customerId: string | null;
  public readonly clientTxnId: string;
  public readonly shiftSessionId: string | null;
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
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.customerId = props.customerId;
    this.clientTxnId = props.clientTxnId;
    this.shiftSessionId = props.shiftSessionId;
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

    // Validate tender sum equals grand total (BR-SAL-003, integer piasters).
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
      companyId: props.companyId,
      branchId: props.branchId,
      cashierId: props.cashierId,
      customerId: props.customerId ?? null,
      clientTxnId: props.clientTxnId,
      shiftSessionId: props.shiftSessionId ?? null,
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

  /**
   * Void the order. Permitted only while the order's shift session matches the
   * provided current session (BR-SAL-006). Returns the reason for audit.
   */
  public void(reason: string, currentShiftSessionId: string | null): void {
    if (this._status !== 'completed')
      throw new Error(`Cannot void an order in status "${this._status}"`);
    if (this.shiftSessionId !== currentShiftSessionId) {
      throw new Error(
        'Order can only be voided during the same shift session in which it was created (BR-SAL-006)',
      );
    }
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

// ─── ShiftSession ────────────────────────────────────────────────────────────

export interface ShiftSessionProps {
  id: string;
  companyId: string;
  branchId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  openingCashPiasters: number;
  closingCashPiasters: number | null;
  status: ShiftStatus;
}

export class ShiftSession {
  public readonly id: string;
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly openedAt: string;
  private _closedAt: string | null;
  public readonly openingCashPiasters: number;
  private _closingCashPiasters: number | null;
  private _status: ShiftStatus;

  private constructor(props: ShiftSessionProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.openedAt = props.openedAt;
    this._closedAt = props.closedAt;
    this.openingCashPiasters = props.openingCashPiasters;
    this._closingCashPiasters = props.closingCashPiasters;
    this._status = props.status;
  }

  public static open(props: {
    companyId: string;
    branchId: string;
    cashierId: string;
    openingCashPiasters: number;
  }): ShiftSession {
    return new ShiftSession({
      id: Identifier.generate(),
      companyId: props.companyId,
      branchId: props.branchId,
      cashierId: props.cashierId,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingCashPiasters: props.openingCashPiasters,
      closingCashPiasters: null,
      status: 'open',
    });
  }

  public static reconstitute(props: ShiftSessionProps): ShiftSession {
    return new ShiftSession(props);
  }

  public get status(): ShiftStatus {
    return this._status;
  }
  public get closedAt(): string | null {
    return this._closedAt;
  }
  public get closingCashPiasters(): number | null {
    return this._closingCashPiasters;
  }

  public close(closingCashPiasters: number): void {
    if (this._status !== 'open') throw new Error('Shift session is not open');
    this._closingCashPiasters = closingCashPiasters;
    this._closedAt = new Date().toISOString();
    this._status = 'closed';
  }
}
