import { DomainEventBase } from '@packages/shared-kernel';
import { ReturnStatus } from '../value-objects';

export class OrderCompleted extends DomainEventBase {
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly customerId: string | null;
  public readonly grandTotalPiasters: number;
  public readonly clientTxnId: string;

  public constructor(props: {
    orderId: string;
    branchId: string;
    cashierId: string;
    customerId: string | null;
    grandTotalPiasters: number;
    clientTxnId: string;
  }) {
    super(props.orderId, 'Order');
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.customerId = props.customerId;
    this.grandTotalPiasters = props.grandTotalPiasters;
    this.clientTxnId = props.clientTxnId;
  }
}

export class OrderVoided extends DomainEventBase {
  public readonly voidedByUserId: string;
  public readonly reason: string;

  public constructor(props: { orderId: string; voidedByUserId: string; reason: string }) {
    super(props.orderId, 'Order');
    this.voidedByUserId = props.voidedByUserId;
    this.reason = props.reason;
  }
}

export class ReturnRequested extends DomainEventBase {
  public readonly originalOrderId: string;
  public readonly refundAmountPiasters: number;
  public readonly status: ReturnStatus;

  public constructor(props: {
    returnId: string;
    originalOrderId: string;
    refundAmountPiasters: number;
    status: ReturnStatus;
  }) {
    super(props.returnId, 'Return');
    this.originalOrderId = props.originalOrderId;
    this.refundAmountPiasters = props.refundAmountPiasters;
    this.status = props.status;
  }
}

export class ReturnApproved extends DomainEventBase {
  public readonly originalOrderId: string;
  public readonly approvedByUserId: string;
  public readonly refundAmountPiasters: number;

  public constructor(props: {
    returnId: string;
    originalOrderId: string;
    approvedByUserId: string;
    refundAmountPiasters: number;
  }) {
    super(props.returnId, 'Return');
    this.originalOrderId = props.originalOrderId;
    this.approvedByUserId = props.approvedByUserId;
    this.refundAmountPiasters = props.refundAmountPiasters;
  }
}

export class ReturnRejected extends DomainEventBase {
  public readonly originalOrderId: string;
  public readonly rejectedByUserId: string;

  public constructor(props: {
    returnId: string;
    originalOrderId: string;
    rejectedByUserId: string;
  }) {
    super(props.returnId, 'Return');
    this.originalOrderId = props.originalOrderId;
    this.rejectedByUserId = props.rejectedByUserId;
  }
}

export class CashDrawerOpened extends DomainEventBase {
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly trigger: 'sale' | 'manager_no_sale';

  public constructor(props: {
    drawerSessionId: string;
    branchId: string;
    cashierId: string;
    trigger: 'sale' | 'manager_no_sale';
  }) {
    super(props.drawerSessionId, 'CashDrawerSession');
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.trigger = props.trigger;
  }
}
