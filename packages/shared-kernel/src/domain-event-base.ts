import { Identifier } from './identifier';
import { DateTime } from './date-time';

/**
 * Base abstract class for all Domain Events in the system.
 */
export abstract class DomainEventBase {
  public readonly eventId: string;
  public readonly occurredAt: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;

  protected constructor(aggregateId: string, aggregateType: string) {
    this.eventId = Identifier.generate();
    this.occurredAt = DateTime.now().toIso();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }
}
