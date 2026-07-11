import { OutboxStore, SyncTransport } from './ports/engine.ports';

/**
 * OutboxDrainer is the background worker that pushes pending outbox events to a
 * peer (or relay) over the active transport. It polls for `pending` events,
 * sends them, marks them `sent`, then marks them `acknowledged` once the
 * transport confirms delivery.
 */
export class OutboxDrainer {
  public constructor(
    private readonly outbox: OutboxStore,
    private readonly transport: SyncTransport,
  ) {}

  /** Drains all pending events for a device to a peer. Returns the count sent. */
  public async drain(deviceId: string, peer: string): Promise<number> {
    const pending = await this.outbox.getPending(deviceId);
    if (pending.length === 0) return 0;

    await this.transport.send(pending, peer);

    for (const event of pending) {
      await this.outbox.markSent(event.eventId);
      await this.outbox.markAcknowledged(event.eventId);
    }
    return pending.length;
  }
}
