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
  public readonly autoApproved: boolean;

  public constructor(props: { poId: string; autoApproved: boolean }) {
    super(props.poId, 'PurchaseOrder');
    this.autoApproved = props.autoApproved;
  }
}

export class PurchaseOrderApproved extends DomainEventBase {
  public readonly approvedByUserId: string;

  public constructor(props: { poId: string; approvedByUserId: string }) {
    super(props.poId, 'PurchaseOrder');
    this.approvedByUserId = props.approvedByUserId;
  }
}

export class PurchaseOrderRejected extends DomainEventBase {
  public readonly reason: string;

  public constructor(props: { poId: string; reason: string }) {
    super(props.poId, 'PurchaseOrder');
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
  public readonly ocrJobId: string;
  public readonly fieldCount: number;

  public constructor(props: { supplierId: string; ocrJobId: string; fieldCount: number }) {
    super(props.supplierId, 'Supplier');
    this.ocrJobId = props.ocrJobId;
    this.fieldCount = props.fieldCount;
  }
}

export { SupplierCreated, SupplierPaymentRecorded } from './supplier-events';
