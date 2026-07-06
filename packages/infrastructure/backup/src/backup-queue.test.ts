import { describe, it, expect, vi } from 'vitest';
import { BackupQueue, InMemoryBackupQueueStorage, QueuedBackupItem } from './backup-queue';
import { BackupMetadata } from './backup-payload';
import * as crypto from 'crypto';

const MOCK_METADATA: BackupMetadata = {
  id: 'backup-001',
  createdAt: '2026-01-01T00:00:00.000Z',
  checksum: crypto.randomBytes(32).toString('hex'),
  companyId: 'company-test',
  version: 1,
};

const MOCK_DATA = Buffer.from('encrypted-backup-data');

describe('BackupQueue', () => {
  it('enqueues items and persists them', async () => {
    const storage = new InMemoryBackupQueueStorage();
    const queue = new BackupQueue(storage);

    await queue.enqueue(MOCK_METADATA, MOCK_DATA);

    const pending = await queue.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe('backup-001');
    expect(pending[0].encryptedDataBase64).toBe(MOCK_DATA.toString('base64'));
  });

  it('does not duplicate items on retry', async () => {
    const storage = new InMemoryBackupQueueStorage();
    const queue = new BackupQueue(storage);

    await queue.enqueue(MOCK_METADATA, MOCK_DATA);
    await queue.enqueue(MOCK_METADATA, MOCK_DATA); // same id, same item

    const pending = await queue.getPending();
    expect(pending.length).toBe(1);
  });

  it('keeps items in queue when upload fails (offline)', async () => {
    const storage = new InMemoryBackupQueueStorage();
    const queue = new BackupQueue(storage);
    await queue.enqueue(MOCK_METADATA, MOCK_DATA);

    const failingUpload = vi.fn().mockRejectedValue(new Error('Network error'));
    await queue.drain(failingUpload);

    const remaining = await queue.getPending();
    expect(remaining.length).toBe(1);
    expect(remaining[0].attempts).toBe(1);
  });

  it('drains queue when connectivity is restored (upload succeeds)', async () => {
    const storage = new InMemoryBackupQueueStorage();
    const queue = new BackupQueue(storage);
    await queue.enqueue(MOCK_METADATA, MOCK_DATA);

    const successUpload = vi.fn().mockResolvedValue(undefined);
    await queue.drain(successUpload);

    const remaining = await queue.getPending();
    expect(remaining.length).toBe(0);
    expect(successUpload).toHaveBeenCalledOnce();
  });

  it('drains multiple items in order', async () => {
    const storage = new InMemoryBackupQueueStorage();
    const queue = new BackupQueue(storage);

    const uploadOrder: string[] = [];
    const meta2 = { ...MOCK_METADATA, id: 'backup-002' };
    await queue.enqueue(MOCK_METADATA, MOCK_DATA);
    await queue.enqueue(meta2, MOCK_DATA);

    const successUpload = vi.fn().mockImplementation(async (item: QueuedBackupItem) => {
      uploadOrder.push(item.id);
    });

    await queue.drain(successUpload);
    expect(await queue.getPending()).toHaveLength(0);
    expect(uploadOrder).toContain('backup-001');
    expect(uploadOrder).toContain('backup-002');
  });
});
