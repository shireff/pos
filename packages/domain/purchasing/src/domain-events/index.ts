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

export class PurchaseOrderApproved extends DomainEventBase {
  public readonly approvedByUserId: string;

  public constructor(props: { poId: string; approvedByUserId: string }) {
    super(props.poId, 'PurchaseOrder');
    this.approvedByUserId = props.approvedByUserId;
  }
}

export class PurchaseOrderReceived extends DomainEventBase {
  public readonly hasDiscrepancy: boolean;

  public constructor(props: { poId: string; hasDiscrepancy: boolean }) {
    super(props.poId, 'PurchaseOrder');
    this.hasDiscrepancy = props.hasDiscrepancy;
  }
}

export class PurchaseOrderCancelled extends DomainEventBase {
  public constructor(props: { poId: string }) {
    super(props.poId, 'PurchaseOrder');
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

export class SupplierInvoiceConfirmed extends DomainEventBase {
  public readonly ocrJobId: string;
  public readonly correctionCount: number;

  public constructor(props: { supplierId: string; ocrJobId: string; correctionCount: number }) {
    super(props.supplierId, 'Supplier');
    this.ocrJobId = props.ocrJobId;
    this.correctionCount = props.correctionCount;
  }
}
