import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { Identifier } from '@packages/shared-kernel';
import {
  BackupManifestStorage,
  BackupDataSource,
  RestoreTarget,
  BackupFileStore,
  BackupUploadQueue,
} from './ports';
import type { BackupManifest, BackupCollectionSnapshot } from './ports';
import { CreateBackupHandler, RestoreBackupHandler } from './create-backup.command';

function memoryManifests(): BackupManifestStorage {
  const all: BackupManifest[] = [];
  return {
    async save(m) {
      all.push(m);
    },
    async update(id, patch) {
      const i = all.findIndex((x) => x.id === id);
      if (i >= 0) all[i] = { ...all[i], ...patch };
    },
    async findById(id) {
      return all.find((x) => x.id === id) ?? null;
    },
    async findByCompany() {
      return all;
    },
    async findLatest() {
      return all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    },
    async findByTimestamp() {
      return null;
    },
  };
}

function memoryFileStore(): BackupFileStore {
  const store = new Map<string, { raw: Buffer; checksum: string }>();
  return {
    async write(_companyId, rawData, _key) {
      const id = Identifier.generate();
      const checksum = crypto.createHash('sha256').update(rawData).digest('hex');
      store.set(id, { raw: rawData, checksum });
      return { id, checksum, size: rawData.length };
    },
    readEncrypted(id) {
      const e = store.get(id);
      if (!e) throw new Error('not found');
      return e.raw;
    },
    async readDecrypted(id, expectedChecksum, _key) {
      const e = store.get(id);
      if (!e) throw new Error('not found');
      if (e.checksum !== expectedChecksum) throw new Error('integrity');
      return e.raw;
    },
    existsLocal(id) {
      return store.has(id);
    },
    deleteLocal(id) {
      store.delete(id);
    },
  };
}

function memoryQueue(): BackupUploadQueue {
  const items: Array<{ manifest: BackupManifest; data: Buffer }> = [];
  return {
    async enqueue(manifest, data) {
      items.push({ manifest, data });
    },
    async drain(upload) {
      for (const it of items) await upload(it.manifest, it.data);
      items.length = 0;
    },
    async getPending() {
      return items;
    },
  };
}

function fakeDataSource(): BackupDataSource {
  return {
    async listCompanyCollections() {
      return ['products'];
    },
    async snapshot() {
      return [{ name: 'products', documents: [{ _id: 'p1', name: 'Coffee' }] }] as BackupCollectionSnapshot[];
    },
  };
}

const keyProvider = {
  async resolveKey() {
    return { key: crypto.randomBytes(32), keyId: 'test-key' };
  },
  async rotateKey() {
    return { key: crypto.randomBytes(32), keyId: 'test-key-2' };
  },
} as any;

describe('Backup use-cases', () => {
  it('CreateBackupHandler writes a full backup and records a manifest', async () => {
    const manifests = memoryManifests();
    const handler = new CreateBackupHandler({
      manifests,
      dataSource: fakeDataSource(),
      restoreTarget: {} as RestoreTarget,
      keyProvider,
      fileStore: memoryFileStore(),
      uploader: { async upload() { throw new Error('offline'); } } as any,
      uploadQueue: memoryQueue(),
      cleanup: { evaluate: () => ({ purgeLocal: [], purgeRemote: [] }) } as any,
      retention: { localRetention: 30, remoteRetention: 90 },
    });

    const result = await handler.execute({ companyId: 'c1' });
    expect(result.type).toBe('full');
    expect(result.backupId).toBeTruthy();

    const saved = await manifests.findById(result.backupId);
    expect(saved).not.toBeNull();
    expect(saved!.collections[0].name).toBe('products');
  });

  it('RestoreBackupHandler verifies integrity and applies the snapshot', async () => {
    const manifests = memoryManifests();
    const fileStore = memoryFileStore();
    let restored: BackupCollectionSnapshot[] = [];

    const handler = new CreateBackupHandler({
      manifests,
      dataSource: fakeDataSource(),
      restoreTarget: {} as RestoreTarget,
      keyProvider,
      fileStore,
      uploader: { async upload() { throw new Error('offline'); } } as any,
      uploadQueue: memoryQueue(),
      cleanup: { evaluate: () => ({ purgeLocal: [], purgeRemote: [] }) } as any,
      retention: { localRetention: 30, remoteRetention: 90 },
    });
    const created = await handler.execute({ companyId: 'c1' });

    const restoreHandler = new RestoreBackupHandler({
      manifests,
      dataSource: fakeDataSource(),
      restoreTarget: {
        async restoreCollections(_companyId, collections) {
          restored = collections;
          return { restoredCollections: collections.length, restoredRows: 1 };
        },
      } as RestoreTarget,
      keyProvider,
      fileStore,
      uploader: {} as any,
      uploadQueue: memoryQueue(),
      cleanup: {} as any,
      retention: { localRetention: 30, remoteRetention: 90 },
    });

    const result = await restoreHandler.execute({
      companyId: 'c1',
      backupId: created.backupId,
      confirmText: 'RESTORE',
    });
    expect(result.restoredCollections).toBe(1);
    expect(restored[0].name).toBe('products');
  });

  it('RestoreBackupHandler throws without RESTORE confirmation', async () => {
    const handler = new RestoreBackupHandler({
      manifests: memoryManifests(),
      dataSource: fakeDataSource(),
      restoreTarget: {} as RestoreTarget,
      keyProvider,
      fileStore: memoryFileStore(),
      uploader: {} as any,
      uploadQueue: memoryQueue(),
      cleanup: {} as any,
      retention: { localRetention: 30, remoteRetention: 90 },
    });
    await expect(
      handler.execute({ companyId: 'c1', backupId: 'missing', confirmText: 'nope' }),
    ).rejects.toThrow(/RESTORE/i);
  });
});
