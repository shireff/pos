import { DomainEventBase } from '@packages/shared-kernel';

/**
 * Emitted by the loyalty service when a customer's loyalty tier increases,
 * triggering a Low-priority (batched) congratulatory notification (Notifications.md §3).
 */
export class LoyaltyTierUpgraded extends DomainEventBase {
  public readonly companyId: string;
  public readonly customerId: string;
  public readonly previousTier: string;
  public readonly newTier: string;

  public constructor(props: {
    eventId: string;
    companyId: string;
    customerId: string;
    previousTier: string;
    newTier: string;
  }) {
    super(props.eventId, 'LoyaltyAccount');
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.previousTier = props.previousTier;
    this.newTier = props.newTier;
  }
}
