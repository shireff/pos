import { Identifier } from '@packages/shared-kernel';
import { LoyaltyEventType } from '../value-objects';

export interface LoyaltyEventProps {
  id: string;
  companyId: string;
  customerId: string;
  eventType: LoyaltyEventType;
  amountPoints: number;
  referenceType: string | null;
  referenceId: string | null;
  occurredAt: string;
  createdAt: string;
}

export class LoyaltyEvent {
  public readonly id: string;
  public readonly companyId: string;
  public readonly customerId: string;
  public readonly eventType: LoyaltyEventType;
  public readonly amountPoints: number;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly occurredAt: string;
  public readonly createdAt: string;

  private constructor(props: LoyaltyEventProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.eventType = props.eventType;
    this.amountPoints = props.amountPoints;
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.occurredAt = props.occurredAt;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    companyId: string;
    customerId: string;
    eventType: LoyaltyEventType;
    amountPoints: number;
    referenceType?: string | null;
    referenceId?: string | null;
    occurredAt?: string;
  }): LoyaltyEvent {
    return new LoyaltyEvent({
      id: Identifier.generate(),
      companyId: props.companyId,
      customerId: props.customerId,
      eventType: props.eventType,
      amountPoints: props.amountPoints,
      referenceType: props.referenceType ?? null,
      referenceId: props.referenceId ?? null,
      occurredAt: props.occurredAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  public static reconstitute(props: LoyaltyEventProps): LoyaltyEvent {
    return new LoyaltyEvent(props);
  }
}
