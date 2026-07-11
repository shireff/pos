import { SyncOutboxEntry, SyncInboxEntry, SyncConflict } from '@packages/domain-sync';

/**
 * Legacy repositories kept for backwards compatibility (interfaces originally
 * defined in Phase 01). The Phase 12 engine uses the storage-agnostic ports in
 * `engine.ports.ts`; these remain available for infra adapters that already
 * implement them.
 */
export interface SyncOutboxRepository {
  /** Append-only — written in the same transaction as every domain write. */
  append(entry: SyncOutboxEntry): Promise<void>;
  findPending(deviceId: string): Promise<SyncOutboxEntry[]>;
  markSent(id: string): Promise<void>;
  markAcknowledged(id: string): Promise<void>;
}

export interface SyncInboxRepository {
  append(entry: SyncInboxEntry): Promise<void>;
  findPending(): Promise<SyncInboxEntry[]>;
  markApplied(id: string): Promise<void>;
  markConflict(id: string): Promise<void>;
}

export interface SyncConflictRepository {
  save(conflict: SyncConflict): Promise<void>;
  findPending(companyId: string): Promise<SyncConflict[]>;
  findById(id: string): Promise<SyncConflict | null>;
}

export interface SyncCursorRepository {
  getSequence(deviceId: string, peerOrServer: string): Promise<number>;
  updateSequence(deviceId: string, peerOrServer: string, sequence: number): Promise<void>;
}
