/**
 * Sync classification for the Sales bounded context.
 *
 * Phase 15 (Sync) defines two merge strategies for replicated collections:
 *
 *  - Class A (append-only): events are never overwritten. Conflicting writes
 *    are stored as additional events; the latest wins only by ordering, never
 *    by mutation. Used for orders and returns — a completed sale / approved
 *    return is an immutable financial fact and must survive concurrent edits
 *    across devices (it is also the source of inventory and loyalty moves).
 *
 *  - Class B (field-level HLC merge): header fields carry a Hybrid Logical
 *    Clock timestamp; the transaction with the later HLC wins per field, and
 *    concurrent edits on the same field are surfaced as a manual conflict.
 *    Used for shift_sessions (a mutable operational record).
 *
 * This module is the single source of truth consumed by the sync engine and
 * the migration runner so replication behaviour cannot silently drift.
 */

export type SyncClass = 'A' | 'B';

export interface SyncClassDefinition {
  collection: string;
  syncClass: SyncClass;
  description: string;
}

export const SALES_SYNC_CLASSIFICATIONS: SyncClassDefinition[] = [
  {
    collection: 'orders',
    syncClass: 'A',
    description:
      'Class A — OrderCompleted events are append-only, replayed by eventId, never overwritten.',
  },
  {
    collection: 'order_lines',
    syncClass: 'A',
    description: 'Class A — follows the parent order; immutable once the order is completed.',
  },
  {
    collection: 'payments',
    syncClass: 'A',
    description: 'Class A — payment facts are immutable and must never be mutated or deleted.',
  },
  {
    collection: 'returns',
    syncClass: 'A',
    description: 'Class A — ReturnApproved events are append-only.',
  },
  {
    collection: 'return_lines',
    syncClass: 'A',
    description: 'Class A — follows the parent return; immutable once the return is approved.',
  },
  {
    collection: 'shift_sessions',
    syncClass: 'B',
    description: 'Class B — field-level HLC merge for mutable shift session fields (cash counts).',
  },
];

const BY_COLLECTION = new Map<string, SyncClassDefinition>(
  SALES_SYNC_CLASSIFICATIONS.map((d) => [d.collection, d]),
);

/** Returns the sync class for a collection, defaulting to Class B (HLC merge). */
export function getSyncClass(collection: string): SyncClass {
  return BY_COLLECTION.get(collection)?.syncClass ?? 'B';
}

/** True when the collection is append-only (Class A) and must never be mutated in place. */
export function isAppendOnly(collection: string): boolean {
  return getSyncClass(collection) === 'A';
}

/** True when the collection uses field-level HLC merge (Class B). */
export function usesFieldLevelHlc(collection: string): boolean {
  return getSyncClass(collection) === 'B';
}
