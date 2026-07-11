import { SyncEvent } from '@packages/domain-sync';

/** Minimal WebSocket surface we depend on (satisfied by `ws` and the browser WebSocket). */
export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState: number;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
  onmessage: ((ev: { data: string | Buffer }) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export const WS_CONNECTING = 0;
export const WS_OPEN = 1;
export const WS_CLOSING = 2;
export const WS_CLOSED = 3;

export interface DeviceDiscovery {
  /** Announce this device's presence on the local network. */
  announce(deviceId: string): void;
  /** Subscribe to discovered peer devices. Returns an unsubscribe fn. */
  onPeer(handler: (peerDeviceId: string, peerUrl: string) => void): () => void;
  /** Discover peers currently present (one-shot). */
  discover(): string[];
  stop(): void;
}

export interface RealtimeChannelLike {
  subscribe(handler: () => void): void;
  send(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void): void;
  unsubscribe(): void;
}

export interface RealtimeClientLike {
  channel(name: string): RealtimeChannelLike;
}

/** Wire protocol envelope exchanged over a transport. */
export interface SyncEnvelope {
  from: string;
  events: SyncEvent[];
}

export function encodeEnvelope(from: string, events: SyncEvent[]): string {
  const envelope: SyncEnvelope = { from, events };
  return JSON.stringify(envelope);
}

export function decodeEnvelope(raw: string | Buffer): SyncEnvelope {
  return JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf-8')) as SyncEnvelope;
}
