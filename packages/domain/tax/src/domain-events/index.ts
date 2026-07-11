import { DomainEventBase } from '@packages/shared-kernel';

export class TaxRuleCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly name: string;

  public constructor(props: { taxRuleId: string; companyId: string; name: string }) {
    super(props.taxRuleId, 'TaxRule');
    this.companyId = props.companyId;
    this.name = props.name;
  }
}

export class TaxRuleUpdated extends DomainEventBase {
  public readonly companyId: string;
  public readonly name: string;

  public constructor(props: { taxRuleId: string; companyId: string; name: string }) {
    super(props.taxRuleId, 'TaxRule');
    this.companyId = props.companyId;
    this.name = props.name;
  }
}

export class PriceChangeRequested extends DomainEventBase {
  public readonly companyId: string;
  public readonly productId: string;
  public readonly newPricePiasters: number;

  public constructor(props: { priceChangeId: string; companyId: string; productId: string; newPricePiasters: number }) {
    super(props.priceChangeId, 'PriceChange');
    this.companyId = props.companyId;
    this.productId = props.productId;
    this.newPricePiasters = props.newPricePiasters;
  }
}

export class PriceChangeApproved extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { priceChangeId: string; companyId: string }) {
    super(props.priceChangeId, 'PriceChange');
    this.companyId = props.companyId;
  }
}

export class PriceChangeRejected extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { priceChangeId: string; companyId: string }) {
    super(props.priceChangeId, 'PriceChange');
    this.companyId = props.companyId;
  }
}
