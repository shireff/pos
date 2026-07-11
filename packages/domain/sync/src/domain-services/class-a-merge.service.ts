import { Identifier } from '@packages/shared-kernel';

export type ClassAEventType =
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT'
  | 'PURCHASE_RECEIPT';

/**
 * A Class A event carries a SIGNED quantity delta for a single entity
 * (e.g. stock of a product). Replaying events in any order always yields the
 * same projection because the merge is the commutative sum of signed deltas.
 * This makes Class A merges conflict-free by construction.
 */
export interface ClassAEvent {
  eventId: string;
  entityId: string;
  eventType: ClassAEventType;
  /** Positive adds to the projection, negative subtracts. */
  signedQuantity: number;
  /** Audit / loyalty events are append-only and never merged numerically. */
  appendOnly?: boolean;
}

export interface ClassAProjection {
  /** Map of entityId -> signed total (e.g. current stock). */
  totals: Map<string, number>;
  /** Append-only events keyed by eventId (de-duplicated). */
  appended: ClassAEvent[];
}

/**
 * ClassAMergeService implements the commutative event-replay merge strategy
 * for Class A (append-only / sum-of-signed-quantities) entities.
 *
 * Key guarantees:
 *  - Order independence: applying the same set of events in any order gives the
 *    identical projection (verified by the property-based commutativity test).
 *  - Idempotency: replaying an already-applied eventId is a no-op.
 *  - Never conflicts: by construction there is no last-writer-wins, so no
 *    SyncConflict is ever produced.
 */
export class ClassAMergeService {
  /**
   * Applies a set of Class A events to a starting projection and returns the
   * merged result. Safe to call repeatedly with overlapping event sets; each
   * eventId is applied at most once.
   */
  public static apply(
    events: ClassAEvent[],
    base: ClassAProjection = { totals: new Map(), appended: [] },
  ): ClassAProjection {
    const totals = new Map(base.totals);
    const appliedIds = new Set(base.appended.map((e) => e.eventId));
    const appended: ClassAEvent[] = [...base.appended];

    for (const event of events) {
      if (appliedIds.has(event.eventId)) continue;
      appliedIds.add(event.eventId);

      if (event.appendOnly) {
        appended.push(event);
        continue;
      }

      const current = totals.get(event.entityId) ?? 0;
      totals.set(event.entityId, current + event.signedQuantity);
      appended.push(event);
    }

    return { totals, appended };
  }

  /**
   * Returns the merged signed total for a single entity across all events,
   * ignoring event ordering. Used by the property test to assert that every
   * permutation of the same event set yields the same number.
   */
  public static totalForEntity(events: ClassAEvent[], entityId: string): number {
    return events
      .filter((e) => !e.appendOnly && e.entityId === entityId)
      .reduce((sum, e) => sum + e.signedQuantity, 0);
  }

  /** Builds a deterministic Class A event with a fresh UUIDv7 eventId. */
  public static makeEvent(props: Omit<ClassAEvent, 'eventId'>): ClassAEvent {
    return { eventId: Identifier.generate(), ...props };
  }
}
