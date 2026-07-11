import { describe, it, expect, vi } from 'vitest';
import { SyncEvent } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { WebSocketTransport } from './websocket.transport';
import { WebSocketLike, WS_OPEN, WS_CLOSED } from './transport-types';

class FakeSocket implements WebSocketLike {
  readyState = WS_OPEN;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  onmessage: ((ev: { data: string | Buffer }) => void) | null = null;
  constructor(public url: string) {}
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = WS_CLOSED;
    this.onclose?.();
  }
}

function makeEvent(): SyncEvent {
  return SyncEvent.create({
    eventType: 'product.updated',
    payload: { entityType: 'products', entityId: 'p1', fields: {} },
    hlcTimestamp: new HybridLogicalClock(10, 0, 'A'),
    deviceId: 'A',
    companyId: 'c1',
  });
}

describe('WebSocketTransport', () => {
  it('sends encoded events to the relay', async () => {
    const created: FakeSocket[] = [];
    const factory = (url: string) => {
      const s = new FakeSocket(url);
      created.push(s);
      return s;
    };
    const transport = new WebSocketTransport({
      url: 'ws://relay',
      deviceId: 'A',
      socketFactory: factory,
    });

    const evt = makeEvent();
    await transport.send([evt], 'relay');

    expect(created).toHaveLength(1);
    const envelope = JSON.parse(created[0].sent[0]);
    expect(envelope.from).toBe('A');
    expect(envelope.events[0].eventId).toBe(evt.eventId);
  });

  it('delivers inbound events to subscribers', async () => {
    const created: FakeSocket[] = [];
    const factory = (url: string) => {
      const s = new FakeSocket(url);
      created.push(s);
      return s;
    };
    const transport = new WebSocketTransport({
      url: 'ws://relay',
      deviceId: 'A',
      socketFactory: factory,
    });

    const handler = vi.fn();
    transport.receive(handler);
    const evt = makeEvent();
    created[0].onmessage?.({ data: JSON.stringify({ from: 'B', events: [evt] }) });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].eventId).toBe(evt.eventId);
  });

  it('throws on send after close', async () => {
    const factory = (url: string) => new FakeSocket(url);
    const transport = new WebSocketTransport({
      url: 'ws://relay',
      deviceId: 'A',
      socketFactory: factory,
    });
    await transport.close();
    await expect(transport.send([makeEvent()])).rejects.toThrow();
  });
});
