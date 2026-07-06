import { describe, it, expect, vi } from 'vitest';
import { SupabaseStorageAdapter } from './supabase-storage.adapter';
import * as crypto from 'crypto';

function makeMockSupabaseClient(online: boolean) {
  return {
    storage: {
      from: () => ({
        upload: vi
          .fn()
          .mockResolvedValue(online ? { error: null } : { error: { message: 'Network Error' } }),
        download: vi
          .fn()
          .mockResolvedValue(
            online
              ? { data: new Blob([Buffer.from('test')]), error: null }
              : { data: null, error: { message: 'Network Error' } },
          ),
        list: vi
          .fn()
          .mockResolvedValue(
            online
              ? { data: [{ name: 'abc.enc', created_at: '2026-01-01T00:00:00Z' }], error: null }
              : { data: null, error: { message: 'Network Error' } },
          ),
      }),
    },
  };
}

const MOCK_PAYLOAD = {
  id: 'test-backup-id',
  createdAt: '2026-01-01T00:00:00.000Z',
  checksum: crypto.randomBytes(32).toString('hex'),
  encryptedData: Buffer.from('mock-encrypted-data'),
  iv: crypto.randomBytes(12).toString('hex'),
  version: 1,
  companyId: 'company-001',
};

describe('SupabaseStorageAdapter', () => {
  it('uploads backup when online', async () => {
    const mockClient = makeMockSupabaseClient(true);
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient as any,
    );

    const key = await adapter.upload(MOCK_PAYLOAD);
    expect(key).toBe('company-001/test-backup-id.enc');
  });

  it('throws when Supabase is offline', async () => {
    const mockClient = makeMockSupabaseClient(false);
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient as any,
    );

    await expect(adapter.upload(MOCK_PAYLOAD)).rejects.toThrow(/Supabase upload failed/);
  });

  it('lists snapshots from remote storage', async () => {
    const mockClient = makeMockSupabaseClient(true);
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient as any,
    );

    const snapshots = await adapter.listSnapshots('company-001');
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].id).toBe('abc');
  });
});
