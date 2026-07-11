import { describe, it, expect, vi } from 'vitest';
import { SyncEvent } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { LanTransport } from './lan.transport';
import { WebSocketLike, WS_OPEN, DeviceDiscovery } from './transport-types';

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
  close() {}
}

class FakeDiscovery implements DeviceDiscovery {
  peerHandlers: ((id: string, url: string) => void)[] = [];
  constructor(private peers: Record<string, string>) {}
  announce(_id: string) {}
  onPeer(handler: (id: string, url: string) => void) {
    this.peerHandlers.push(handler);
    for (const [id, url] of Object.entries(this.peers)) handler(id, url);
    return () => {};
  }
  discover() {
    return Object.keys(this.peers);
  }
  stop() {}
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

describe('LanTransport', () => {
  it('discovers peers over mDNS and opens direct channels', () => {
    const discovery = new FakeDiscovery({ B: 'ws://peer-b', C: 'ws://peer-c' });
    const created: FakeSocket[] = [];
    const factory = (url: string) => {
      const s = new FakeSocket(url);
      created.push(s);
      return s;
    };
    const transport = new LanTransport({
      deviceId: 'A',
      discovery,
      socketFactory: factory,
    });

    expect(transport.peerCount).toBe(2);
    expect(transport.discoverPeers().sort()).toEqual(['B', 'C']);
    expect(created).toHaveLength(2);
  });

  it('sends events directly to a peer without cloud', async () => {
    const discovery = new FakeDiscovery({ B: 'ws://peer-b' });
    const created: FakeSocket[] = [];
    const factory = (url: string) => {
      const s = new FakeSocket(url);
      created.push(s);
      return s;
    };
    const transport = new LanTransport({ deviceId: 'A', discovery, socketFactory: factory });

    const evt = makeEvent();
    await transport.send([evt], 'B');

    const envelope = JSON.parse(created[0].sent[0]);
    expect(envelope.from).toBe('A');
    expect(envelope.events[0].eventId).toBe(evt.eventId);
  });

  it('delivers events received on a peer channel', async () => {
    const discovery = new FakeDiscovery({ B: 'ws://peer-b' });
    const created: FakeSocket[] = [];
    const factory = (url: string) => {
      const s = new FakeSocket(url);
      created.push(s);
      return s;
    };
    const transport = new LanTransport({ deviceId: 'A', discovery, socketFactory: factory });

    const handler = vi.fn();
    transport.receive(handler);
    const evt = makeEvent();
    created[0].onmessage?.({ data: JSON.stringify({ from: 'B', events: [evt] }) });

    expect(handler).toHaveBeenCalledOnce();
  });
});
