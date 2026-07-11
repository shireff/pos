import { SyncEvent } from '@packages/domain-sync';
import { InboxStore } from './ports/engine.ports';

/**
 * BacklogPaginator catches a device up after an extended offline period by
 * pulling events from a source in bounded pages (so memory and time stay
 * bounded even for very large backlogs — E2E Flow #6). Each page is appended to
 * the inbox; the cursor advances by the last event's id. The loop stops when a
 * page is smaller than the page size (end of backlog).
 */
export interface BacklogSource {
  /** Returns up to `limit` events strictly after `since` (event id), oldest first. */
  pull(since: string | null, limit: number, companyId: string): Promise<SyncEvent[]>;
}

export class BacklogPaginator {
  private readonly source: BacklogSource;
  private readonly inbox: InboxStore;
  private readonly pageSize: number;

  public constructor(source: BacklogSource, inbox: InboxStore, pageSize = 100) {
    this.source = source;
    this.inbox = inbox;
    this.pageSize = pageSize;
  }

  /** Pulls all events after `since` into the inbox. Returns the total pulled. */
  public async catchUp(companyId: string, since: string | null = null): Promise<number> {
    let total = 0;
    let cursor: string | null = since;

    // Bound the number of iterations to guard against a pathological source.
    const maxPages = 1_000_000;
    for (let page = 0; page < maxPages; page++) {
      const events = await this.source.pull(cursor, this.pageSize, companyId);
      if (events.length === 0) break;

      for (const event of events) {
        await this.inbox.append(event);
      }
      total += events.length;
      cursor = events[events.length - 1].eventId;

      if (events.length < this.pageSize) break;
    }
    return total;
  }
}
