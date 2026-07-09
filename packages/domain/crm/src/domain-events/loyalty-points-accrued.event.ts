import { DomainEventBase } from '@packages/shared-kernel';

export class LoyaltyPointsAccrued extends DomainEventBase {
  public readonly customerId: string;
  public readonly companyId: string;
  public readonly pointsAccrued: number;
  public readonly newBalance: number;
  public readonly orderId: string | null;

  public constructor(props: {
    eventId: string;
    customerId: string;
    companyId: string;
    pointsAccrued: number;
    newBalance: number;
    orderId?: string | null;
  }) {
    super(props.eventId, 'LoyaltyAccount');
    this.customerId = props.customerId;
    this.companyId = props.companyId;
    this.pointsAccrued = props.pointsAccrued;
    this.newBalance = props.newBalance;
    this.orderId = props.orderId ?? null;
  }
}
