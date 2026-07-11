import { describe, it, expect, vi } from 'vitest';
import { HybridLogicalClock, Identifier } from '@packages/shared-kernel';
import { SyncEvent, SyncConflict, FieldState } from '@packages/domain-sync';
import { InboxProcessor } from './inbox-processor';
import {
  InboxStore,
  ReplicaStore,
  ConflictStore,
} from './ports/engine.ports';
import { InMemoryIdempotencyStore } from './idempotency-store';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

function makeEvent(partial: Partial<SyncEvent> & Pick<SyncEvent, 'eventType' | 'payload' | 'companyId' | 'deviceId' | 'hlcTimestamp'>): SyncEvent {
  return SyncEvent.reconstitute(
    {
      eventId: partial.eventId ?? Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...partial,
    },
    'pending',
  );
}

class MemInbox implements InboxStore {
  events: SyncEvent[] = [];
  applied = new Set<string>();
  async append(e: SyncEvent) { this.events.push(e); }
  async getPending() { return this.events.filter((e) => !this.applied.has(e.eventId)); }
  async markApplied(id: string) { this.applied.add(id); }
  async markConflict(_id: string) {}
}

class MemConflicts implements ConflictStore {
  conflicts: SyncConflict[] = [];
  async save(c: SyncConflict) { this.conflicts.push(c); }
  async findPending(_c: string) { return this.conflicts.filter((x) => x.isUnresolved); }
  async findById(id: string) { return this.conflicts.find((c) => c.id === id) ?? null; }
}

class MemReplica implements ReplicaStore {
  classA: Record<string, number> = {};
  docs: Record<string, Record<string, FieldState>> = {};
  async applyClassA(events: { entityId: string; signedQuantity: number }[]) {
    for (const e of events) {
      this.classA[e.entityId] = (this.classA[e.entityId] ?? 0) + e.signedQuantity;
    }
  }
  async getFieldStates(_t: string, id: string) {
    return this.docs[id] ?? {};
  }
  async putFieldStates(_t: string, id: string, states: Record<string, FieldState>) {
    this.docs[id] = states;
  }
}

describe('InboxProcessor', () => {
  it('applies Class A stock events (commutative, no conflict)', async () => {
    const inbox = new MemInbox();
    inbox.events.push(
      makeEvent({
        eventType: 'sale',
        companyId: 'c1',
        deviceId: 'A',
        hlcTimestamp: hlc(10, 0, 'A'),
        payload: { entityType: 'stock_items', entityId: 'p1', eventType: 'SALE', signedQuantity: -5 },
      }),
      makeEvent({
        eventType: 'sale',
        companyId: 'c1',
        deviceId: 'B',
        hlcTimestamp: hlc(11, 0, 'B'),
        payload: { entityType: 'stock_items', entityId: 'p1', eventType: 'SALE', signedQuantity: -3 },
      }),
    );

    const replica = new MemReplica();
    const processor = new InboxProcessor({
      inbox,
      idempotency: new InMemoryIdempotencyStore(),
      replica,
      conflicts: new MemConflicts(),
    });

    const result = await processor.processPending('c1');
    expect(result).toEqual({ applied: 2, conflicts: 0, skipped: 0 });
    expect(replica.classA['p1']).toBe(-8);
  });

  it('detects a Class B concurrent conflict and records it', async () => {
    const inbox = new MemInbox();
    inbox.events.push(
      makeEvent({
        eventType: 'product.updated',
        companyId: 'c1',
        deviceId: 'A',
        hlcTimestamp: hlc(10, 0, 'A'),
        payload: {
          entityType: 'products',
          entityId: 'p1',
          fields: { price: { value: 100, hlc: hlc(10, 0, 'A') } as FieldState },
        },
      }),
      makeEvent({
        eventType: 'product.updated',
        companyId: 'c1',
        deviceId: 'B',
        hlcTimestamp: hlc(10, 0, 'B'),
        payload: {
          entityType: 'products',
          entityId: 'p1',
          fields: { price: { value: 120, hlc: hlc(10, 0, 'B') } as FieldState },
        },
      }),
    );

    const replica = new MemReplica();
    const conflicts = new MemConflicts();
    const onConflict = vi.fn();
    const processor = new InboxProcessor({
      inbox,
      idempotency: new InMemoryIdempotencyStore(),
      replica,
      conflicts,
      onConflictDetected: onConflict,
    });

    const result = await processor.processPending('c1');
    expect(result.conflicts).toBe(1);
    expect(conflicts.conflicts).toHaveLength(1);
    expect(onConflict).toHaveBeenCalledOnce();
    expect(conflicts.conflicts[0].field).toBe('price');
  });

  it('is idempotent: replaying an applied event is a no-op', async () => {
    const inbox = new MemInbox();
    const e = makeEvent({
      eventType: 'product.updated',
      companyId: 'c1',
      deviceId: 'A',
      hlcTimestamp: hlc(12, 0, 'A'),
      payload: {
        entityType: 'products',
        entityId: 'p1',
        fields: { price: { value: 99, hlc: hlc(12, 0, 'A') } as FieldState },
      },
    });
    inbox.events.push(e, e);

    const processor = new InboxProcessor({
      inbox,
      idempotency: new InMemoryIdempotencyStore(),
      replica: new MemReplica(),
      conflicts: new MemConflicts(),
    });

    const result = await processor.processPending('c1');
    expect(result.applied).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('auto-applies non-conflicting Class B fields', async () => {
    const inbox = new MemInbox();
    inbox.events.push(
      makeEvent({
        eventType: 'product.updated',
        companyId: 'c1',
        deviceId: 'A',
        hlcTimestamp: hlc(10, 0, 'A'),
        payload: { entityType: 'products', entityId: 'p1', fields: { price: { value: 100, hlc: hlc(10, 0, 'A') } as FieldState } },
      }),
      makeEvent({
        eventType: 'product.updated',
        companyId: 'c1',
        deviceId: 'B',
        hlcTimestamp: hlc(9, 0, 'B'),
        payload: { entityType: 'products', entityId: 'p1', fields: { description: { value: 'x', hlc: hlc(9, 0, 'B') } as FieldState } },
      }),
    );

    const replica = new MemReplica();
    const processor = new InboxProcessor({
      inbox,
      idempotency: new InMemoryIdempotencyStore(),
      replica,
      conflicts: new MemConflicts(),
    });

    const result = await processor.processPending('c1');
    expect(result).toEqual({ applied: 2, conflicts: 0, skipped: 0 });
    const doc = await replica.getFieldStates('products', 'p1');
    expect((doc['price'] as FieldState).value).toBe(100);
    expect((doc['description'] as FieldState).value).toBe('x');
  });
});
