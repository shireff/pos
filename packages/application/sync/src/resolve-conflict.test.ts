import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncConflict, FieldState } from '@packages/domain-sync';
import { ConflictResolutionService } from './resolve-conflict';
import { ConflictStore, ReplicaStore } from './ports/engine.ports';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

class MemConflicts implements ConflictStore {
  conflicts: SyncConflict[] = [];
  async save(c: SyncConflict) {
    const i = this.conflicts.findIndex((x) => x.id === c.id);
    if (i >= 0) this.conflicts[i] = c;
    else this.conflicts.push(c);
  }
  async findPending(companyId: string) {
    return this.conflicts.filter((c) => c.companyId === companyId && c.isUnresolved);
  }
  async findById(id: string) {
    return this.conflicts.find((c) => c.id === id) ?? null;
  }
}

class MemReplica implements ReplicaStore {
  docs: Record<string, Record<string, FieldState>> = {};
  async applyClassA() {}
  async getFieldStates(t: string, id: string) {
    return this.docs[`${t}:${id}`] ?? {};
  }
  async putFieldStates(t: string, id: string, states: Record<string, FieldState>) {
    this.docs[`${t}:${id}`] = states;
  }
}

function makeConflict(): SyncConflict {
  return SyncConflict.detect({
    companyId: 'c1',
    entityType: 'products',
    entityId: 'p1',
    field: 'price',
    localValue: 100,
    remoteValue: 120,
    localHlc: hlc(10, 0, 'A'),
    remoteHlc: hlc(10, 0, 'B'),
  });
}

describe('ConflictResolutionService', () => {
  it('resolves to remote, records audit, and applies the value to the replica', async () => {
    const conflicts = new MemConflicts();
    const replica = new MemReplica();
    await conflicts.save(makeConflict());
    const service = new ConflictResolutionService({ conflicts, replica });

    const resolved = await service.resolve(conflicts.conflicts[0].id, 'remote', 'u1');
    expect(resolved.status).toBe('resolved_remote');
    expect(resolved.auditTrail.at(-1)?.byUserId).toBe('u1');
    expect((await replica.getFieldStates('products', 'p1'))['price'].value).toBe(120);
  });

  it('resolves a merge with a custom value', async () => {
    const conflicts = new MemConflicts();
    const replica = new MemReplica();
    await conflicts.save(makeConflict());
    const service = new ConflictResolutionService({ conflicts, replica });

    const resolved = await service.resolve(conflicts.conflicts[0].id, 'merge', 'u1', 110);
    expect(resolved.status).toBe('resolved_merge');
    expect((await replica.getFieldStates('products', 'p1'))['price'].value).toBe(110);
  });

  it('bulk-resolves all conflicts for an entity', async () => {
    const conflicts = new MemConflicts();
    const replica = new MemReplica();
    const c1 = makeConflict();
    const c2 = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'products',
      entityId: 'p1',
      field: 'description',
      localValue: 'a',
      remoteValue: 'b',
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    await conflicts.save(c1);
    await conflicts.save(c2);
    const service = new ConflictResolutionService({ conflicts, replica });

    const count = await service.resolveAllForEntity('c1', 'products', 'p1', 'local', 'u1');
    expect(count).toBe(2);
    expect(conflicts.conflicts.every((c) => !c.isUnresolved)).toBe(true);
  });
});
