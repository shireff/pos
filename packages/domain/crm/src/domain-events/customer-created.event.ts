import { DomainEventBase } from '@packages/shared-kernel';

export class CustomerCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly name: string;
  public readonly phone: string;
  public readonly loyaltyCode: string;

  public constructor(props: {
    customerId: string;
    companyId: string;
    name: string;
    phone: string;
    loyaltyCode: string;
  }) {
    super(props.customerId, 'Customer');
    this.companyId = props.companyId;
    this.name = props.name;
    this.phone = props.phone;
    this.loyaltyCode = props.loyaltyCode;
  }
}
