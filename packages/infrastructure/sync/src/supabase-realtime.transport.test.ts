import { describe, it, expect, vi } from 'vitest';
import { SyncEvent } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SupabaseRealtimeTransport } from './supabase-realtime.transport';
import { RealtimeChannelLike, RealtimeClientLike } from './transport-types';

class FakeChannel implements RealtimeChannelLike {
  subs: (() => void)[] = [];
  handlers: Record<string, ((p: unknown) => void)[]> = {};
  sent: { event: string; payload: unknown }[] = [];
  subscribe(h: () => void) {
    this.subs.push(h);
  }
  send(event: string, payload: unknown) {
    this.sent.push({ event, payload });
  }
  on(event: string, handler: (p: unknown) => void) {
    (this.handlers[event] ??= []).push(handler);
  }
  unsubscribe() {}
  emit(event: string, payload: unknown) {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}

class FakeClient implements RealtimeClientLike {
  channels: FakeChannel[] = [];
  channel(_name: string) {
    const c = new FakeChannel();
    this.channels.push(c);
    return c;
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

describe('SupabaseRealtimeTransport', () => {
  it('publishes events to the company-scoped channel', async () => {
    const client = new FakeClient();
    const transport = new SupabaseRealtimeTransport({
      deviceId: 'A',
      companyId: 'c1',
      client,
    });

    const evt = makeEvent();
    await transport.send([evt]);

    expect(client.channels).toHaveLength(1);
    expect(client.channels[0].sent[0].event).toBe('sync:batch');
    expect((client.channels[0].sent[0].payload as SyncEvent[])[0].eventId).toBe(evt.eventId);
  });

  it('delivers events received on the channel', async () => {
    const client = new FakeClient();
    const transport = new SupabaseRealtimeTransport({ deviceId: 'A', companyId: 'c1', client });

    const handler = vi.fn();
    transport.receive(handler);
    const evt = makeEvent();
    client.channels[0].emit('sync:batch', [evt]);

    expect(handler).toHaveBeenCalledOnce();
  });
});
