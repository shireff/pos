import { DomainEventBase } from '@packages/shared-kernel';
import { ReturnStatus, ShiftStatus, TenderType } from '../value-objects';

export class OrderCompleted extends DomainEventBase {
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly customerId: string | null;
  public readonly grandTotalPiasters: number;
  public readonly clientTxnId: string;

  public constructor(props: {
    orderId: string;
    companyId: string;
    branchId: string;
    cashierId: string;
    customerId: string | null;
    grandTotalPiasters: number;
    clientTxnId: string;
  }) {
    super(props.orderId, 'Order');
    this.companyId = props.companyId;
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
  public readonly shiftSessionId: string | null;

  public constructor(props: {
    orderId: string;
    voidedByUserId: string;
    reason: string;
    shiftSessionId: string | null;
  }) {
    super(props.orderId, 'Order');
    this.voidedByUserId = props.voidedByUserId;
    this.reason = props.reason;
    this.shiftSessionId = props.shiftSessionId;
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

/**
 * ReverseLoyaltyPointsCommand is emitted when an approved return reverses the
 * loyalty points earned on the original sale (BR-SAL-007). It is dispatched to
 * the CRM / loyalty bounded context.
 */
export class ReverseLoyaltyPointsCommand {
  public readonly returnId: string;
  public readonly customerId: string | null;
  public readonly originalOrderId: string;
  public readonly pointsToReverse: number;

  public constructor(props: {
    returnId: string;
    customerId: string | null;
    originalOrderId: string;
    pointsToReverse: number;
  }) {
    this.returnId = props.returnId;
    this.customerId = props.customerId;
    this.originalOrderId = props.originalOrderId;
    this.pointsToReverse = props.pointsToReverse;
  }
}

export class ShiftSessionOpened extends DomainEventBase {
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly openingCashPiasters: number;

  public constructor(props: {
    shiftSessionId: string;
    companyId: string;
    branchId: string;
    cashierId: string;
    openingCashPiasters: number;
  }) {
    super(props.shiftSessionId, 'ShiftSession');
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.openingCashPiasters = props.openingCashPiasters;
  }
}

export class ShiftSessionClosed extends DomainEventBase {
  public readonly companyId: string;
  public readonly branchId: string;
  public readonly cashierId: string;
  public readonly closingCashPiasters: number;
  public readonly status: ShiftStatus;

  public constructor(props: {
    shiftSessionId: string;
    companyId: string;
    branchId: string;
    cashierId: string;
    closingCashPiasters: number;
    status: ShiftStatus;
  }) {
    super(props.shiftSessionId, 'ShiftSession');
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.cashierId = props.cashierId;
    this.closingCashPiasters = props.closingCashPiasters;
    this.status = props.status;
  }
}

export class PaymentCompleted extends DomainEventBase {
  public readonly companyId: string;
  public readonly orderId: string;
  public readonly tenderType: TenderType;
  public readonly amountPiasters: number;
  public readonly externalReference: string | null;

  public constructor(props: {
    transactionId: string;
    companyId: string;
    orderId: string;
    tenderType: TenderType;
    amountPiasters: number;
    externalReference?: string | null;
  }) {
    super(props.transactionId, 'PaymentTransaction');
    this.companyId = props.companyId;
    this.orderId = props.orderId;
    this.tenderType = props.tenderType;
    this.amountPiasters = props.amountPiasters;
    this.externalReference = props.externalReference ?? null;
  }
}

export class PaymentRefunded extends DomainEventBase {
  public readonly companyId: string;
  public readonly orderId: string;
  public readonly tenderType: TenderType;
  public readonly amountPiasters: number;
  public readonly reason: string | null;

  public constructor(props: {
    transactionId: string;
    companyId: string;
    orderId: string;
    tenderType: TenderType;
    amountPiasters: number;
    reason?: string | null;
  }) {
    super(props.transactionId, 'PaymentTransaction');
    this.companyId = props.companyId;
    this.orderId = props.orderId;
    this.tenderType = props.tenderType;
    this.amountPiasters = props.amountPiasters;
    this.reason = props.reason ?? null;
  }
}
