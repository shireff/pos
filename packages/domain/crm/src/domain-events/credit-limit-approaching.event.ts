import { DomainEventBase } from '@packages/shared-kernel';

/**
 * Emitted by the nightly customer-ledger check when a customer's credit balance
 * exceeds 80% of their credit limit, prompting a High-priority alert (Notifications.md §3).
 */
export class CreditLimitApproaching extends DomainEventBase {
  public readonly companyId: string;
  public readonly customerId: string;
  public readonly creditBalancePiasters: number;
  public readonly creditLimitPiasters: number;

  public constructor(props: {
    eventId: string;
    companyId: string;
    customerId: string;
    creditBalancePiasters: number;
    creditLimitPiasters: number;
  }) {
    super(props.eventId, 'Customer');
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.creditBalancePiasters = props.creditBalancePiasters;
    this.creditLimitPiasters = props.creditLimitPiasters;
  }
}
