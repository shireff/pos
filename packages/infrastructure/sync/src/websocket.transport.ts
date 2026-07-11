import { SyncEvent } from '@packages/domain-sync';
import { SyncTransport, TransportKind } from '@packages/application-sync';
import {
  WebSocketLike,
  WebSocketFactory,
  WS_OPEN,
  encodeEnvelope,
  decodeEnvelope,
} from './transport-types';

export interface WebSocketTransportOptions {
  url: string;
  deviceId: string;
  /** Injected so the transport is unit-testable without a real socket. */
  socketFactory?: WebSocketFactory;
  /** Socket factory for the browser/global WebSocket when not injected. */
  globalWebSocket?: WebSocketFactory;
}

/**
 * WebSocketTransport connects to a backend relay over a standard WebSocket.
 * It auto-reconnects with exponential backoff. It satisfies the SyncTransport
 * interface used by the outbox drainer and inbox processor.
 */
export class WebSocketTransport implements SyncTransport {
  public readonly kind: TransportKind = 'websocket';
  private socket: WebSocketLike | null = null;
  private handlers: ((e: SyncEvent) => void)[] = [];
  private openHandlers: (() => void)[] = [];
  private connected = false;
  private closed = false;
  private reconnectAttempts = 0;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  public constructor(private readonly opts: WebSocketTransportOptions) {
    this.baseDelayMs = 500;
    this.maxDelayMs = 15_000;
    this.connect();
  }

  private get factory(): WebSocketFactory {
    return this.opts.socketFactory ?? this.opts.globalWebSocket ?? defaultFactory();
  }

  private connect(): void {
    if (this.closed) return;
    const socket = this.factory(this.opts.url);
    this.socket = socket;
    socket.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.openHandlers.forEach((h) => h());
    };
    socket.onclose = () => {
      this.connected = false;
      if (!this.closed) this.scheduleReconnect();
    };
    socket.onmessage = (ev) => {
      try {
        const envelope = decodeEnvelope(ev.data);
        for (const event of envelope.events) this.handlers.forEach((h) => h(event));
      } catch {
        /* ignore malformed envelope */
      }
    };
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.baseDelayMs * 2 ** (this.reconnectAttempts - 1), this.maxDelayMs);
    setTimeout(() => this.connect(), delay);
  }

  public async send(events: SyncEvent[], _peer?: string): Promise<void> {
    if (events.length === 0) return;
    if (!this.socket || this.socket.readyState !== WS_OPEN) {
      throw new Error('WebSocketTransport: socket not open');
    }
    this.socket.send(encodeEnvelope(this.opts.deviceId, events));
  }

  public receive(handler: (e: SyncEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  public onOpen(handler: () => void): void {
    if (this.connected) handler();
    else this.openHandlers.push(handler);
  }

  public async close(): Promise<void> {
    this.closed = true;
    this.socket?.close();
    this.socket = null;
  }
}

function defaultFactory(): WebSocketFactory {
  // At runtime (browser/Node with ws) this resolves the global WebSocket.
  const wsf = (globalThis as unknown as { WebSocket?: WebSocketFactory }).WebSocket;
  if (!wsf) throw new Error('WebSocketTransport: no WebSocket implementation available');
  return wsf;
}
