import { DomainEventBase } from '@packages/shared-kernel';

export class PurchaseOrderCreated extends DomainEventBase {
  public readonly supplierId: string;
  public readonly companyId: string;

  public constructor(props: { poId: string; supplierId: string; companyId: string }) {
    super(props.poId, 'PurchaseOrder');
    this.supplierId = props.supplierId;
    this.companyId = props.companyId;
  }
}

export class PurchaseOrderSubmitted extends DomainEventBase {
  public readonly companyId: string;
  public readonly autoApproved: boolean;

  public constructor(props: { poId: string; companyId: string; autoApproved: boolean }) {
    super(props.poId, 'PurchaseOrder');
    this.companyId = props.companyId;
    this.autoApproved = props.autoApproved;
  }
}

export class PurchaseOrderApproved extends DomainEventBase {
  public readonly companyId: string;
  public readonly approvedByUserId: string;

  public constructor(props: { poId: string; companyId: string; approvedByUserId: string }) {
    super(props.poId, 'PurchaseOrder');
    this.companyId = props.companyId;
    this.approvedByUserId = props.approvedByUserId;
  }
}

export class PurchaseOrderRejected extends DomainEventBase {
  public readonly companyId: string;
  public readonly reason: string;

  public constructor(props: { poId: string; companyId: string; reason: string }) {
    super(props.poId, 'PurchaseOrder');
    this.companyId = props.companyId;
    this.reason = props.reason;
  }
}

export class PurchaseOrderCancelled extends DomainEventBase {
  public readonly reason: string;

  public constructor(props: { poId: string; reason: string }) {
    super(props.poId, 'PurchaseOrder');
    this.reason = props.reason;
  }
}

export class GoodsReceived extends DomainEventBase {
  public readonly hasDiscrepancy: boolean;

  public constructor(props: { poId: string; hasDiscrepancy: boolean }) {
    super(props.poId, 'PurchaseOrder');
    this.hasDiscrepancy = props.hasDiscrepancy;
  }
}

export class SupplierInvoiceRecorded extends DomainEventBase {
  public readonly invoiceId: string;
  public readonly supplierId: string;

  public constructor(props: { poId: string; invoiceId: string; supplierId: string }) {
    super(props.poId, 'PurchaseOrder');
    this.invoiceId = props.invoiceId;
    this.supplierId = props.supplierId;
  }
}

export class SupplierInvoiceOCRExtracted extends DomainEventBase {
  public readonly companyId: string;
  public readonly supplierId: string;

  public constructor(props: { invoiceId: string; companyId: string; supplierId: string }) {
    super(props.invoiceId, 'SupplierInvoice');
    this.companyId = props.companyId;
    this.supplierId = props.supplierId;
  }
}

/**
 * Emitted by the nightly supplier-ledger check when a supplier payment is overdue,
 * triggering an alert to the owner/accountant (Notifications.md §3).
 */
export class SupplierOverduePayment extends DomainEventBase {
  public readonly companyId: string;
  public readonly supplierId: string;
  public readonly overduePiasters: number;
  public readonly daysOverdue: number;

  public constructor(props: {
    eventId: string;
    companyId: string;
    supplierId: string;
    overduePiasters: number;
    daysOverdue: number;
  }) {
    super(props.eventId, 'SupplierInvoice');
    this.companyId = props.companyId;
    this.supplierId = props.supplierId;
    this.overduePiasters = props.overduePiasters;
    this.daysOverdue = props.daysOverdue;
  }
}

export { SupplierCreated, SupplierPaymentRecorded } from './supplier-events';
