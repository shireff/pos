import { IdempotencyStore } from './ports/engine.ports';

/**
 * In-memory idempotency store backed by a Set. For production durability this
 * is mirrored to the `applied_events_cache` MongoDB collection (see infra repo).
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly applied: Set<string>;

  public constructor(initial: string[] = []) {
    this.applied = new Set(initial);
  }

  public async isApplied(eventId: string): Promise<boolean> {
    return this.applied.has(eventId);
  }

  public async markApplied(eventId: string): Promise<void> {
    this.applied.add(eventId);
  }
}

/**
 * Returns only the items whose id has NOT yet been marked applied, then marks
 * the survivors applied. Used by the inbox processor to drop duplicate replays.
 */
export async function dedupeApplied<T>(
  store: IdempotencyStore,
  items: T[],
  getId: (item: T) => string,
): Promise<T[]> {
  const survivors: T[] = [];
  for (const item of items) {
    const id = getId(item);
    if (await store.isApplied(id)) continue;
    survivors.push(item);
    await store.markApplied(id);
  }
  return survivors;
}
