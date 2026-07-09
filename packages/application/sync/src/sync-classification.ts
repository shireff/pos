/**
 * Sync classification for the Purchasing bounded context.
 *
 * Phase 15 (Sync) defines two merge strategies for replicated collections:
 *
 *  - Class A (append-only): events are never overwritten. Conflicting writes
 *    are stored as additional events; the latest wins only by ordering, never
 *    by mutation. Used for goods receipt lines — a receipt is an immutable
 *    fact and must survive concurrent edits across devices.
 *
 *  - Class B (field-level HLC merge): header fields carry a Hybrid Logical
 *    Clock timestamp; the transaction with the later HLC wins per field, and
 *    concurrent edits on the same field are surfaced as a manual conflict.
 *    Used for purchase order headers and supplier invoices.
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

export const PURCHASING_SYNC_CLASSIFICATIONS: SyncClassDefinition[] = [
  {
    collection: 'purchase_orders',
    syncClass: 'B',
    description:
      'Class B — field-level HLC merge for mutable header fields (status, notes, expectedDeliveryDate).',
  },
  {
    collection: 'purchase_order_lines',
    syncClass: 'B',
    description: 'Class B — follows the parent purchase order header lifecycle.',
  },
  {
    collection: 'goods_receipts',
    syncClass: 'A',
    description: 'Class A — receipt events are append-only and never overwritten.',
  },
  {
    collection: 'goods_receipt_lines',
    syncClass: 'A',
    description:
      'Class A — append-only receipt events; never overwritten (BR-SUP-002 discrepancies must be preserved).',
  },
  {
    collection: 'goods_receipt_discrepancies',
    syncClass: 'A',
    description: 'Class A — discrepancy records are immutable facts.',
  },
  {
    collection: 'supplier_invoices',
    syncClass: 'B',
    description: 'Class B — field-level HLC merge for invoice header fields.',
  },
];

const BY_COLLECTION = new Map<string, SyncClassDefinition>(
  PURCHASING_SYNC_CLASSIFICATIONS.map((d) => [d.collection, d]),
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
