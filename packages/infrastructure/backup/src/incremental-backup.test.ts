import { describe, it, expect } from 'vitest';
import { IncrementalBackupEngine, serializeSnapshot, deserializeSnapshot } from './incremental-backup';
import type { BackupDataSource } from './incremental-backup';

function fakeSource(seq: number): BackupDataSource {
  return {
    listCompanyCollections: async () => ['products'],
    snapshot: async (companyId, _opts) => [
      {
        name: 'products',
        documents: [{ _id: `${companyId}-${seq}`, updated_at: new Date().toISOString() }],
      },
    ],
  };
}

describe('IncrementalBackupEngine', () => {
  it('first run (no lastBackupAt) is full', async () => {
    const engine = new IncrementalBackupEngine(fakeSource(1));
    const res = await engine.collect({ companyId: 'c1' });
    expect(res.type).toBe('full');
  });

  it('subsequent run (with lastBackupAt) is incremental', async () => {
    const engine = new IncrementalBackupEngine(fakeSource(2));
    const res = await engine.collect({ companyId: 'c1', lastBackupAt: new Date().toISOString() });
    expect(res.type).toBe('incremental');
  });

  it('round-trips snapshot serialization', () => {
    const cols = [{ name: 'a', documents: [{ x: 1 }] }];
    expect(deserializeSnapshot(serializeSnapshot(cols))).toEqual(cols);
  });
});
