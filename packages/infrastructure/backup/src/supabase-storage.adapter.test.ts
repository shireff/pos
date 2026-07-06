import { describe, it, expect, vi } from 'vitest';
import { SupabaseStorageAdapter } from './supabase-storage.adapter';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Minimal typed mock matching the Supabase Storage surface used by SupabaseStorageAdapter
interface MockStorageBucket {
  upload: ReturnType<typeof vi.fn>;
  download: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
}

function makeMockSupabaseClient(online: boolean): Pick<SupabaseClient, 'storage'> {
  const bucket: MockStorageBucket = {
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
  };

  return {
    storage: {
      from: () => bucket,
    } as unknown as SupabaseClient['storage'],
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
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      makeMockSupabaseClient(true) as SupabaseClient,
    );

    const key = await adapter.upload(MOCK_PAYLOAD);
    expect(key).toBe('company-001/test-backup-id.enc');
  });

  it('throws when Supabase is offline', async () => {
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      makeMockSupabaseClient(false) as SupabaseClient,
    );

    await expect(adapter.upload(MOCK_PAYLOAD)).rejects.toThrow(/Supabase upload failed/);
  });

  it('lists snapshots from remote storage', async () => {
    const adapter = new SupabaseStorageAdapter(
      { supabaseUrl: 'http://localhost', supabaseKey: 'key', bucketName: 'backups' },
      makeMockSupabaseClient(true) as SupabaseClient,
    );

    const snapshots = await adapter.listSnapshots('company-001');
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].id).toBe('abc');
  });
});
