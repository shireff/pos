import { Db } from 'mongodb';
import { BackupManifest, BackupUploadQueue } from '@packages/application-backup';

interface QueuedDoc {
  _id: string;
  metadata: BackupManifest;
  encrypted_data_base64: string;
  enqueued_at: Date;
  attempts: number;
}

/**
 * MongoBackupUploadQueue — durable offline queue of backups pending cloud
 * upload, stored in `_backup_queue`. Survives app restart; drains on reconnect.
 */
export class MongoBackupUploadQueue implements BackupUploadQueue {
  public constructor(private readonly db: Db) {}

  private coll() {
    return this.db.collection<QueuedDoc>('_backup_queue');
  }

  public async enqueue(manifest: BackupManifest, encryptedData: Buffer): Promise<void> {
    await this.coll().insertOne({
      _id: manifest.id,
      metadata: manifest,
      encrypted_data_base64: encryptedData.toString('base64'),
      enqueued_at: new Date(),
      attempts: 0,
    });
  }

  public async drain(
    upload: (manifest: BackupManifest, data: Buffer) => Promise<void>,
  ): Promise<void> {
    const items = await this.coll().find().toArray();
    for (const item of items) {
      try {
        const data = Buffer.from(item.encrypted_data_base64, 'base64');
        await upload(item.metadata, data);
        await this.coll().deleteOne({ _id: item._id });
      } catch {
        await this.coll().updateOne(
          { _id: item._id },
          { $set: { attempts: item.attempts + 1 } },
        );
      }
    }
  }

  public async getPending(): Promise<Array<{ manifest: BackupManifest; data: Buffer }>> {
    const items = await this.coll().find().toArray();
    return items.map((item) => ({
      manifest: item.metadata,
      data: Buffer.from(item.encrypted_data_base64, 'base64'),
    }));
  }
}
