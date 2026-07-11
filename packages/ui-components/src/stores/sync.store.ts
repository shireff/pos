import { useSyncExternalStore } from 'react';

export type SyncTransportType = 'lan' | 'supabase_realtime' | 'websocket';

export interface SyncConflictView {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  status: 'unresolved' | 'resolved_local' | 'resolved_remote' | 'resolved_merge';
  createdAt: string;
  auditTrail?: Array<{ at: string; byUserId: string | null; resolution: string; value: unknown }>;
}

export interface SyncStatusView {
  companyId: string;
  pendingOutbox: number;
  pendingInbox: number;
  lastSyncedAt: string | null;
  transportType: SyncTransportType;
  offline: boolean;
}

export interface SyncState {
  status: SyncStatusView | null;
  conflicts: SyncConflictView[];
}

const EMPTY: SyncState = { status: null, conflicts: [] };

/**
 * Lightweight external store for sync UI state. No external state library is
 * required — it integrates with React via useSyncExternalStore so the status
 * indicator and conflict panel update in real time without a page refresh.
 */
export class SyncStore {
  private state: SyncState = EMPTY;
  private listeners = new Set<() => void>();

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): SyncState => this.state;

  public setState(next: Partial<SyncState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  }

  public setStatus(status: SyncStatusView): void {
    this.setState({ status });
  }

  public setConflicts(conflicts: SyncConflictView[]): void {
    this.setState({ conflicts });
  }
}

export const syncStore = new SyncStore();

export function useSyncStore(): SyncState {
  return useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot);
}
