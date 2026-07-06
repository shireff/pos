import { DomainEventBase } from '@packages/shared-kernel';

export class CustomerCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly phone: string;

  public constructor(props: { customerId: string; companyId: string; phone: string }) {
    super(props.customerId, 'Customer');
    this.companyId = props.companyId;
    this.phone = props.phone;
  }
}

export class CustomerUpdated extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { customerId: string; companyId: string }) {
    super(props.customerId, 'Customer');
    this.companyId = props.companyId;
  }
}

export class LoyaltyPointsAccrued extends DomainEventBase {
  public readonly customerId: string;
  public readonly pointsDelta: number;
  public readonly referenceOrderId: string;

  public constructor(props: {
    loyaltyEventId: string;
    customerId: string;
    pointsDelta: number;
    referenceOrderId: string;
  }) {
    super(props.loyaltyEventId, 'LoyaltyPointEvent');
    this.customerId = props.customerId;
    this.pointsDelta = props.pointsDelta;
    this.referenceOrderId = props.referenceOrderId;
  }
}

export class LoyaltyPointsRedeemed extends DomainEventBase {
  public readonly customerId: string;
  public readonly pointsDelta: number;
  public readonly referenceOrderId: string;

  public constructor(props: {
    loyaltyEventId: string;
    customerId: string;
    pointsDelta: number;
    referenceOrderId: string;
  }) {
    super(props.loyaltyEventId, 'LoyaltyPointEvent');
    this.customerId = props.customerId;
    this.pointsDelta = props.pointsDelta;
    this.referenceOrderId = props.referenceOrderId;
  }
}

export class LoyaltyPointsReversed extends DomainEventBase {
  public readonly customerId: string;
  public readonly pointsDelta: number;
  public readonly referenceOrderId: string;

  public constructor(props: {
    loyaltyEventId: string;
    customerId: string;
    pointsDelta: number;
    referenceOrderId: string;
  }) {
    super(props.loyaltyEventId, 'LoyaltyPointEvent');
    this.customerId = props.customerId;
    this.pointsDelta = props.pointsDelta;
    this.referenceOrderId = props.referenceOrderId;
  }
}

export class CreditLedgerEntryRecorded extends DomainEventBase {
  public readonly customerId: string;
  public readonly amountPiasters: number;
  public readonly type: 'charge' | 'payment';

  public constructor(props: {
    entryId: string;
    customerId: string;
    amountPiasters: number;
    type: 'charge' | 'payment';
  }) {
    super(props.entryId, 'CreditLedgerEntry');
    this.customerId = props.customerId;
    this.amountPiasters = props.amountPiasters;
    this.type = props.type;
  }
}
