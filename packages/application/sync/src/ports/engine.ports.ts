import { SyncEvent, SyncConflict, FieldState, ClassAEvent } from '@packages/domain-sync';

/**
 * Engine ports used by the sync core (outbox-writer, outbox-drainer,
 * inbox-processor, idempotency-store, conflict-recorder, backlog-paginator).
 * Infrastructure/adapters implement these so the engine stays transport- and
 * storage-agnostic (and unit-testable with in-memory fakes + the simulation harness).
 */

export interface OutboxStore {
  append(event: SyncEvent): Promise<void>;
  getPending(deviceId: string): Promise<SyncEvent[]>;
  markSent(eventId: string): Promise<void>;
  markAcknowledged(eventId: string): Promise<void>;
}

export interface InboxStore {
  append(event: SyncEvent): Promise<void>;
  getPending(): Promise<SyncEvent[]>;
  markApplied(eventId: string): Promise<void>;
  markConflict(eventId: string): Promise<void>;
}

export interface ConflictStore {
  save(conflict: SyncConflict): Promise<void>;
  findPending(companyId: string): Promise<SyncConflict[]>;
  findById(id: string): Promise<SyncConflict | null>;
}

export interface IdempotencyStore {
  isApplied(eventId: string): Promise<boolean>;
  markApplied(eventId: string): Promise<void>;
}

/** Local replica projection store. Applies Class A deltas or Class B field states. */
export interface ReplicaStore {
  applyClassA(events: ClassAEvent[]): Promise<void>;
  getFieldStates(entityType: string, entityId: string): Promise<Record<string, FieldState>>;
  putFieldStates(
    entityType: string,
    entityId: string,
    states: Record<string, FieldState>,
  ): Promise<void>;
}

export type TransportKind = 'lan' | 'supabase_realtime' | 'websocket';

export interface SyncTransport {
  readonly kind: TransportKind;
  send(events: SyncEvent[], peer: string): Promise<void>;
  /** Subscribe to inbound events. Returns an unsubscribe function. */
  receive(handler: (event: SyncEvent) => void): () => void;
  close(): Promise<void>;
}
