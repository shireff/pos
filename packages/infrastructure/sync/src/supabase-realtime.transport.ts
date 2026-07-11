import { SyncEvent } from '@packages/domain-sync';
import { SyncTransport, TransportKind } from '@packages/application-sync';
import { RealtimeClientLike, RealtimeChannelLike } from './transport-types';

export interface SupabaseRealtimeTransportOptions {
  deviceId: string;
  companyId: string;
  client: RealtimeClientLike;
}

/**
 * SupabaseRealtimeTransport syncs via a company-scoped Supabase Realtime channel.
 * Events are published to and consumed from the channel, enabling cross-network
 * sync through the cloud relay when devices are not on the same LAN.
 */
export class SupabaseRealtimeTransport implements SyncTransport {
  public readonly kind: TransportKind = 'supabase_realtime';
  private channel: RealtimeChannelLike;
  private handlers: ((e: SyncEvent) => void)[] = [];
  private closed = false;
  private static readonly EVENT = 'sync:batch';

  public constructor(private readonly opts: SupabaseRealtimeTransportOptions) {
    const channelName = `sync:company:${opts.companyId}`;
    this.channel = opts.client.channel(channelName);
    this.channel.subscribe(() => undefined);
    this.channel.on(SupabaseRealtimeTransport.EVENT, (payload) => {
      try {
        const events = payload as SyncEvent[];
        for (const event of events) this.handlers.forEach((h) => h(event));
      } catch {
        /* ignore malformed payload */
      }
    });
  }

  public async send(events: SyncEvent[]): Promise<void> {
    if (events.length === 0) return;
    if (this.closed) throw new Error('SupabaseRealtimeTransport: closed');
    this.channel.send(SupabaseRealtimeTransport.EVENT, events);
  }

  public receive(handler: (e: SyncEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  public async close(): Promise<void> {
    this.closed = true;
    this.channel.unsubscribe();
  }
}
