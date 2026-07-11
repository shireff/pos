import { SyncEvent } from '@packages/domain-sync';
import { SyncTransport, TransportKind } from '@packages/application-sync';
import {
  WebSocketLike,
  WebSocketFactory,
  DeviceDiscovery,
  WS_OPEN,
  encodeEnvelope,
  decodeEnvelope,
} from './transport-types';

export interface LanTransportOptions {
  deviceId: string;
  discovery: DeviceDiscovery;
  socketFactory?: WebSocketFactory;
  /** Max peers to maintain a direct channel to. */
  maxPeers?: number;
}

/**
 * LanTransport provides zero-latency peer-to-peer sync on the same LAN.
 * Uses mDNS (injected `DeviceDiscovery`) to announce presence and discover
 * peers, then opens a direct WebSocket channel per device pair. Events never
 * round-trip through the cloud when devices are on the same subnet.
 */
export class LanTransport implements SyncTransport {
  public readonly kind: TransportKind = 'lan';
  private channels = new Map<string, WebSocketLike>();
  private handlers: ((e: SyncEvent) => void)[] = [];
  private closed = false;
  private readonly maxPeers: number;

  public constructor(private readonly opts: LanTransportOptions) {
    this.maxPeers = opts.maxPeers ?? 32;
    this.opts.discovery.announce(opts.deviceId);
    this.opts.discovery.onPeer((peerId, peerUrl) => this.openChannel(peerId, peerUrl));
  }

  private get factory(): WebSocketFactory {
    if (!this.opts.socketFactory) throw new Error('LanTransport: socketFactory required');
    return this.opts.socketFactory;
  }

  private openChannel(peerId: string, peerUrl: string): void {
    if (this.closed || this.channels.has(peerId)) return;
    if (this.channels.size >= this.maxPeers) return;
    const socket = this.factory(peerUrl);
    this.channels.set(peerId, socket);
    socket.onmessage = (ev) => {
      try {
        const envelope = decodeEnvelope(ev.data);
        for (const event of envelope.events) this.handlers.forEach((h) => h(event));
      } catch {
        /* ignore malformed envelope */
      }
    };
  }

  /** Trigger discovery and return currently known peer ids. */
  public discoverPeers(): string[] {
    return this.opts.discovery.discover();
  }

  public get peerCount(): number {
    return this.channels.size;
  }

  public async send(events: SyncEvent[], peer?: string): Promise<void> {
    if (events.length === 0) return;
    const targets = peer ? [peer] : [...this.channels.keys()];
    for (const peerId of targets) {
      const socket = this.channels.get(peerId);
      if (socket && socket.readyState === WS_OPEN) {
        socket.send(encodeEnvelope(this.opts.deviceId, events));
      }
    }
  }

  public receive(handler: (e: SyncEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  public async close(): Promise<void> {
    this.closed = true;
    this.channels.forEach((s) => s.close());
    this.channels.clear();
    this.opts.discovery.stop();
  }
}
