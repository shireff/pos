import { describe, it, expect } from 'vitest';
import { Identifier } from '@packages/shared-kernel';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { SyncConflict } from './sync-conflict.entity';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

describe('SyncConflict entity', () => {
  it('is created unresolved with an audit trail', () => {
    const conflict = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    expect(conflict.id).toMatch(/[0-9a-f-]{36}/);
    expect(conflict.isUnresolved).toBe(true);
    expect(conflict.auditTrail).toHaveLength(0);
  });

  it('resolves to local and records the audit entry', () => {
    const conflict = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    conflict.resolveLocal('u1');
    expect(conflict.status).toBe('resolved_local');
    expect(conflict.resolvedValue('local')).toBe(100);
    expect(conflict.auditTrail).toHaveLength(1);
    expect(conflict.auditTrail[0].byUserId).toBe('u1');
  });

  it('resolves to remote and merge winners', () => {
    const conflict = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    conflict.resolveRemote('u2');
    expect(conflict.status).toBe('resolved_remote');
    expect(conflict.resolvedValue('remote')).toBe(120);

    const conflict2 = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    conflict2.resolveMerge('u3', 110);
    expect(conflict2.status).toBe('resolved_merge');
    expect(conflict2.resolvedValue('merge', 110)).toBe(110);
  });

  it('cannot be resolved twice', () => {
    const conflict = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    conflict.resolveLocal('u1');
    expect(() => conflict.resolveRemote('u2')).toThrow();
  });

  it('round-trips through reconstitute', () => {
    const conflict = SyncConflict.detect({
      companyId: 'c1',
      entityType: 'product',
      entityId: 'p1',
      field: 'price',
      localValue: 100,
      remoteValue: 120,
      localHlc: hlc(10, 0, 'A'),
      remoteHlc: hlc(10, 0, 'B'),
    });
    conflict.resolveMerge('u3', 110, 'merged');
    const props = {
      id: conflict.id,
      companyId: conflict.companyId,
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      field: conflict.field,
      localValue: conflict.localValue,
      remoteValue: conflict.remoteValue,
      localHlc: conflict.localHlc,
      remoteHlc: conflict.remoteHlc,
      status: conflict.status,
      auditTrail: [...conflict.auditTrail],
      createdAt: conflict.createdAt,
    };
    const restored = SyncConflict.reconstitute(props);
    expect(restored.status).toBe('resolved_merge');
    expect(restored.auditTrail.at(-1)?.note).toBe('merged');
    expect(() => restored.resolveLocal('x')).toThrow();
  });
});
