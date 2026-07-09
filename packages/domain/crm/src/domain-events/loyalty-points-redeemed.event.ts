import { DomainEventBase } from '@packages/shared-kernel';

export class LoyaltyPointsRedeemed extends DomainEventBase {
  public readonly customerId: string;
  public readonly companyId: string;
  public readonly pointsRedeemed: number;
  public readonly newBalance: number;
  public readonly orderId: string | null;

  public constructor(props: {
    eventId: string;
    customerId: string;
    companyId: string;
    pointsRedeemed: number;
    newBalance: number;
    orderId?: string | null;
  }) {
    super(props.eventId, 'LoyaltyAccount');
    this.customerId = props.customerId;
    this.companyId = props.companyId;
    this.pointsRedeemed = props.pointsRedeemed;
    this.newBalance = props.newBalance;
    this.orderId = props.orderId ?? null;
  }
}
