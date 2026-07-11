import { SyncTransport, TransportKind } from '@packages/application-sync';

export interface TransportSelectorDeps {
  deviceId: string;
  companyId: string;
  buildLan: () => SyncTransport;
  buildSupabase: () => SyncTransport;
  buildWebSocket: () => SyncTransport;
  isLanAvailable: () => boolean;
  isSupabaseAvailable: () => boolean;
  /** Called whenever the selected transport changes. */
  onTransportChange?: (kind: TransportKind) => void;
}

interface Candidate {
  kind: TransportKind;
  available: boolean;
  build: () => SyncTransport;
}

/**
 * TransportSelector auto-selects the best available transport in priority order:
 *   1. LAN peer-to-peer (lowest latency, no cloud)
 *   2. Supabase Realtime (cross-network cloud relay)
 *   3. WebSocket fallback (standard relay)
 * It re-evaluates on connectivity change and only rebuilds the active transport
 * when the chosen kind actually changes.
 */
export class TransportSelector {
  private current: SyncTransport | null = null;
  private currentKind: TransportKind | null = null;

  public constructor(private readonly deps: TransportSelectorDeps) {
    this.evaluate();
  }

  /** Recomputes the best transport and switches if the kind changed. */
  public evaluate(): SyncTransport {
    const candidates: Candidate[] = [
      { kind: 'lan', available: this.deps.isLanAvailable(), build: this.deps.buildLan },
      {
        kind: 'supabase_realtime',
        available: this.deps.isSupabaseAvailable(),
        build: this.deps.buildSupabase,
      },
      { kind: 'websocket', available: true, build: this.deps.buildWebSocket },
    ];

    const chosen = candidates.find((c) => c.available);
    if (!chosen) throw new Error('TransportSelector: no transport available');

    if (this.currentKind !== chosen.kind) {
      void this.current?.close();
      this.current = chosen.build();
      this.currentKind = chosen.kind;
      this.deps.onTransportChange?.(chosen.kind);
    }
    return this.current!;
  }

  public get active(): SyncTransport {
    return this.current ?? this.evaluate();
  }

  public get kind(): TransportKind {
    return this.currentKind ?? this.evaluate().kind;
  }

  /** Notify the selector that connectivity changed (e.g. a peer appeared). */
  public notifyConnectivityChange(): void {
    this.evaluate();
  }
}
