import { describe, it, expect, vi } from 'vitest';
import { SyncEvent } from '@packages/domain-sync';
import { SyncTransport, TransportKind } from '@packages/application-sync';
import { TransportSelector } from './transport-selector';

class FakeTransport implements SyncTransport {
  public sent: SyncEvent[] = [];
  constructor(public readonly kind: TransportKind) {}
  async send(events: SyncEvent[]) {
    this.sent.push(...events);
  }
  receive() {
    return () => {};
  }
  async close() {}
}

describe('TransportSelector', () => {
  function build(lan: boolean, supabase: boolean) {
    const transports: Record<string, FakeTransport> = {};
    const selector = new TransportSelector({
      deviceId: 'A',
      companyId: 'c1',
      isLanAvailable: () => lan,
      isSupabaseAvailable: () => supabase,
      buildLan: () => (transports.lan ??= new FakeTransport('lan')),
      buildSupabase: () => (transports.supabase ??= new FakeTransport('supabase_realtime')),
      buildWebSocket: () => (transports.websocket ??= new FakeTransport('websocket')),
    });
    return { selector, transports };
  }

  it('prefers LAN when available', () => {
    const { selector } = build(true, true);
    expect(selector.kind).toBe('lan');
  });

  it('falls back to Supabase Realtime when LAN unavailable', () => {
    const { selector } = build(false, true);
    expect(selector.kind).toBe('supabase_realtime');
  });

  it('falls back to WebSocket when both LAN and Supabase unavailable', () => {
    const { selector } = build(false, false);
    expect(selector.kind).toBe('websocket');
  });

  it('rebuilds the transport only when the chosen kind changes', () => {
    const onTransportChange = vi.fn();
    const transports: Record<string, FakeTransport> = {};
    const selector = new TransportSelector({
      deviceId: 'A',
      companyId: 'c1',
      isLanAvailable: () => true,
      isSupabaseAvailable: () => true,
      buildLan: () => (transports.lan ??= new FakeTransport('lan')),
      buildSupabase: () => (transports.supabase ??= new FakeTransport('supabase_realtime')),
      buildWebSocket: () => (transports.websocket ??= new FakeTransport('websocket')),
      onTransportChange,
    });
    // Constructor already selected LAN (null → lan), so one change fired.
    expect(onTransportChange).toHaveBeenCalledTimes(1);
    expect(transports.lan).toBeDefined();
    // Re-evaluating with the same availability must not rebuild / re-notify.
    selector.evaluate();
    expect(onTransportChange).toHaveBeenCalledTimes(1);
  });
});
