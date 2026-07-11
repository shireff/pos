import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncConflict } from '@packages/domain-sync';

const { store, FakeConflictRepo, FakeReplica } = vi.hoisted(() => {
  const store: SyncConflict[] = [];
  class FakeConflictRepo {
    async save(c: SyncConflict) {
      const i = store.findIndex((x) => x.id === c.id);
      if (i >= 0) store[i] = c;
      else store.push(c);
    }
    async findById(id: string) {
      return store.find((c) => c.id === id) ?? null;
    }
    async findPending() {
      return store.filter((c) => c.isUnresolved);
    }
  }
  class FakeReplica {
    docs: Record<string, unknown> = {};
    async applyClassA() {}
    async getFieldStates() {
      return {};
    }
    async putFieldStates(t: string, id: string, states: Record<string, unknown>) {
      this.docs[`${t}:${id}`] = states;
    }
  }
  return { store, FakeConflictRepo, FakeReplica };
});

vi.mock('@packages/infrastructure-mongodb', () => ({
  getMongoDb: async () => ({}) as never,
}));

vi.mock('@packages/infrastructure-sync', () => ({
  MongoConflictRepository: FakeConflictRepo,
  MongoReplicaStore: FakeReplica,
  MongoOutboxRepository: class {},
  MongoInboxRepository: class {},
}));

import { POST } from './route';

function makeConflict(): SyncConflict {
  return SyncConflict.detect({
    companyId: 'company-1',
    entityType: 'products',
    entityId: 'p1',
    field: 'price',
    localValue: 100,
    remoteValue: 120,
    localHlc: new HybridLogicalClock(10, 0, 'A'),
    remoteHlc: new HybridLogicalClock(10, 0, 'B'),
  });
}

describe('POST /api/v1/sync/conflicts/:id/resolve', () => {
  beforeEach(() => {
    store.length = 0;
  });

  it('resolves to remote (keeps_remote) and writes the value to the replica', async () => {
    const conflict = makeConflict();
    store.push(conflict);

    const request = new NextRequest('http://localhost/api/v1/sync/conflicts/x/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-actor-id': 'u1' },
      body: JSON.stringify({ winner: 'remote' }),
    });

    const response = await POST(request, { params: { id: conflict.id } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('resolved_remote');
  });

  it('resolves to local (keeps_local)', async () => {
    const conflict = makeConflict();
    store.push(conflict);

    const request = new NextRequest('http://localhost/api/v1/sync/conflicts/x/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ winner: 'local' }),
    });

    const response = await POST(request, { params: { id: conflict.id } });
    const body = await response.json();
    expect(body.data.status).toBe('resolved_local');
  });

  it('resolves a merge with a custom value', async () => {
    const conflict = makeConflict();
    store.push(conflict);

    const request = new NextRequest('http://localhost/api/v1/sync/conflicts/x/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ winner: 'merge', resolvedValue: 110 }),
    });

    const response = await POST(request, { params: { id: conflict.id } });
    const body = await response.json();
    expect(body.data.status).toBe('resolved_merge');
  });

  it('rejects an invalid winner with 400', async () => {
    const conflict = makeConflict();
    store.push(conflict);

    const request = new NextRequest('http://localhost/api/v1/sync/conflicts/x/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ winner: 'banana' }),
    });

    const response = await POST(request, { params: { id: conflict.id } });
    expect(response.status).toBe(400);
  });

  it('returns 404 for an unknown conflict', async () => {
    const request = new NextRequest('http://localhost/api/v1/sync/conflicts/x/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ winner: 'local' }),
    });

    const response = await POST(request, { params: { id: 'missing' } });
    expect(response.status).toBe(404);
  });
});
