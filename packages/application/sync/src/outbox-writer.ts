import { SyncEvent } from '@packages/domain-sync';
import { OutboxStore } from './ports/engine.ports';

/**
 * OutboxWriter guarantees the outbox append and the primary domain write are a
 * single logical unit: the domain write runs first and, only after it succeeds,
 * the SyncEvent is appended. A crash between the two leaves the outbox WITHOUT
 * the entry (BR-SYN-008: an outbox entry never expires until acknowledged), so
 * the event is re-derived from the next write — never duplicated in the database
 * while missing from the domain state.
 */
export class OutboxWriter {
  public constructor(private readonly outbox: OutboxStore) {}

  public async write<T>(primary: () => Promise<T>, event: SyncEvent): Promise<T> {
    const result = await primary();
    await this.outbox.append(event);
    return result;
  }
}
