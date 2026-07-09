import { DomainEventBase } from '@packages/shared-kernel';

export class LoyaltyPointsReversed extends DomainEventBase {
  public readonly customerId: string;
  public readonly companyId: string;
  public readonly pointsReversed: number;
  public readonly newBalance: number;
  public readonly returnId: string | null;
  public readonly originalOrderId: string | null;

  public constructor(props: {
    eventId: string;
    customerId: string;
    companyId: string;
    pointsReversed: number;
    newBalance: number;
    returnId?: string | null;
    originalOrderId?: string | null;
  }) {
    super(props.eventId, 'LoyaltyAccount');
    this.customerId = props.customerId;
    this.companyId = props.companyId;
    this.pointsReversed = props.pointsReversed;
    this.newBalance = props.newBalance;
    this.returnId = props.returnId ?? null;
    this.originalOrderId = props.originalOrderId ?? null;
  }
}
