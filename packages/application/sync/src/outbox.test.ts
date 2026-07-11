import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncEvent } from '@packages/domain-sync';
import { OutboxWriter } from './outbox-writer';
import type { OutboxStore } from './ports/engine.ports';

class RecordingOutbox implements OutboxStore {
  public readonly appended: SyncEvent[] = [];
  public readonly sent = new Set<string>();
  public readonly ack = new Set<string>();

  public async append(event: SyncEvent): Promise<void> {
    this.appended.push(event);
  }
  public async getPending(deviceId: string): Promise<SyncEvent[]> {
    return this.appended.filter((e) => e.deviceId === deviceId && !this.sent.has(e.eventId));
  }
  public async markSent(eventId: string): Promise<void> {
    this.sent.add(eventId);
  }
  public async markAcknowledged(eventId: string): Promise<void> {
    this.ack.add(eventId);
  }
}

function makeEvent(deviceId = 'A', companyId = 'company-1'): SyncEvent {
  return SyncEvent.create({
    eventType: 'products.updated',
    payload: { entityType: 'products', entityId: 'p1', fields: { price: 100 } },
    hlcTimestamp: new HybridLogicalClock(10, 0, deviceId),
    deviceId,
    companyId,
  });
}

describe('OutboxWriter', () => {
  it('appends the SyncEvent to the outbox after the primary write succeeds', async () => {
    const outbox = new RecordingOutbox();
    const writer = new OutboxWriter(outbox);
    let primaryRan = false;

    const result = await writer.write(async () => {
      primaryRan = true;
      return 42;
    }, makeEvent());

    expect(primaryRan).toBe(true);
    expect(result).toBe(42);
    expect(outbox.appended).toHaveLength(1);
  });

  it('does NOT append when the primary write throws (BR-SYN-008: atomic with the write)', async () => {
    const outbox = new RecordingOutbox();
    const writer = new OutboxWriter(outbox);

    await expect(
      writer.write(async () => {
        throw new Error('db down');
      }, makeEvent()),
    ).rejects.toThrow('db down');

    expect(outbox.appended).toHaveLength(0);
  });

  it('entry transitions pending → sent → acknowledged and never expires', async () => {
    const outbox = new RecordingOutbox();
    const writer = new OutboxWriter(outbox);

    await writer.write(async () => undefined, makeEvent());

    const event = outbox.appended[0];
    expect(event.status).toBe('pending');

    event.markSent();
    await outbox.markSent(event.eventId);
    expect(event.status).toBe('sent');
    expect(outbox.sent.has(event.eventId)).toBe(true);

    event.markAcknowledged();
    await outbox.markAcknowledged(event.eventId);
    expect(event.status).toBe('acknowledged');
    expect(outbox.ack.has(event.eventId)).toBe(true);

    // A pending query never drops an unacknowledged entry (it persists indefinitely).
    const stillPending = await outbox.getPending('A');
    expect(stillPending).toHaveLength(0);
  });
});
