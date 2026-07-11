import { SyncEvent } from '@packages/domain-sync';

type SyncClass = 'A' | 'B';

/**
 * Collections whose replication is conflict-free by construction (Class A):
 * event-sourced with commutative signed-quantity deltas or pure append-only.
 * Everything else uses per-field HLC merge (Class B).
 */
export const CLASS_A_COLLECTIONS = new Set<string>([
  'stock_items',
  'stock_movement_events',
  'stock_transfers',
  'stock_transfer_lines',
  'loyalty_points',
  'audit_entries',
]);

/** Returns the collection an event mutates, taken from its payload. */
export function eventCollection(event: SyncEvent): string {
  const payload = (event.payload ?? {}) as { entityType?: string; collection?: string };
  return payload.entityType ?? payload.collection ?? 'unknown';
}

/** Classifies a sync event as Class A (append-only / commutative) or Class B (HLC merge). */
export function classifyEvent(event: SyncEvent): SyncClass {
  return CLASS_A_COLLECTIONS.has(eventCollection(event)) ? 'A' : 'B';
}
