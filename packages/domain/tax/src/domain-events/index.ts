import { DomainEventBase } from '@packages/shared-kernel';

export class TaxRuleChanged extends DomainEventBase {
  public readonly companyId: string;
  public readonly beforeJson: string;
  public readonly afterJson: string;

  public constructor(props: {
    taxRuleId: string;
    companyId: string;
    before: object;
    after: object;
  }) {
    super(props.taxRuleId, 'TaxRule');
    this.companyId = props.companyId;
    this.beforeJson = JSON.stringify(props.before);
    this.afterJson = JSON.stringify(props.after);
  }
}

export class ETAModuleActivated extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { companyId: string }) {
    super(props.companyId, 'Company');
    this.companyId = props.companyId;
  }
}

export class ETAInvoiceSubmitted extends DomainEventBase {
  public readonly orderId: string;
  public readonly etaUuid: string;

  public constructor(props: { etaInvoiceId: string; orderId: string; etaUuid: string }) {
    super(props.etaInvoiceId, 'ETAInvoice');
    this.orderId = props.orderId;
    this.etaUuid = props.etaUuid;
  }
}

export class ETAInvoiceSubmissionFailed extends DomainEventBase {
  public readonly orderId: string;

  public constructor(props: { etaInvoiceId: string; orderId: string }) {
    super(props.etaInvoiceId, 'ETAInvoice');
    this.orderId = props.orderId;
  }
}
