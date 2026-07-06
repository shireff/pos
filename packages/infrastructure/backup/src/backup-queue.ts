import { BackupMetadata } from './backup-payload.js';

export interface QueuedBackupItem {
  id: string;
  metadata: BackupMetadata;
  encryptedDataBase64: string;
  enqueuedAt: string;
  attempts: number;
}

export interface BackupQueueStorage {
  getAll(): Promise<QueuedBackupItem[]>;
  save(item: QueuedBackupItem): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * BackupQueue is a durable queue for pending Supabase backup uploads.
 * Items are persisted via a pluggable storage adapter (MongoDB collection in production).
 * When connectivity is restored, the queue auto-drains via drain().
 */
export class BackupQueue {
  private readonly storage: BackupQueueStorage;
  private draining = false;

  public constructor(storage: BackupQueueStorage) {
    this.storage = storage;
  }

  /**
   * Enqueues a backup item for later upload.
   */
  public async enqueue(metadata: BackupMetadata, encryptedData: Buffer): Promise<void> {
    const item: QueuedBackupItem = {
      id: metadata.id,
      metadata,
      encryptedDataBase64: encryptedData.toString('base64'),
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    };
    await this.storage.save(item);
  }

  /**
   * Returns all pending items in the queue.
   */
  public async getPending(): Promise<QueuedBackupItem[]> {
    return await this.storage.getAll();
  }

  /**
   * Drains the queue by attempting to upload each item via the provided upload function.
   * On success, removes the item from the queue.
   * On failure (e.g., still offline), increments attempt count and keeps the item.
   */
  public async drain(upload: (item: QueuedBackupItem) => Promise<void>): Promise<void> {
    if (this.draining) return;
    this.draining = true;

    try {
      const items = await this.storage.getAll();
      for (const item of items) {
        try {
          await upload(item);
          await this.storage.remove(item.id);
        } catch {
          await this.storage.save({ ...item, attempts: item.attempts + 1 });
        }
      }
    } finally {
      this.draining = false;
    }
  }
}

/**
 * InMemoryBackupQueueStorage — test/CI-safe in-memory implementation.
 * Production uses MongoBackupQueueStorage (Phase 01 scope: scaffold + in-memory).
 */
export class InMemoryBackupQueueStorage implements BackupQueueStorage {
  private items: Map<string, QueuedBackupItem> = new Map();

  public async getAll(): Promise<QueuedBackupItem[]> {
    return Array.from(this.items.values());
  }

  public async save(item: QueuedBackupItem): Promise<void> {
    this.items.set(item.id, item);
  }

  public async remove(id: string): Promise<void> {
    this.items.delete(id);
  }
}
