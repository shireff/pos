import {
  SupabaseStorageAdapter,
  BackupPayload,
} from '@packages/infrastructure-backup';
import type { BackupUploader } from '@packages/application-backup';

/**
 * SupabaseBackupUploader — uploads/downloads encrypted backups to Supabase
 * Storage (cloud/secondary location). Failures surface so callers enqueue.
 */
export class SupabaseBackupUploader implements BackupUploader {
  public constructor(private readonly adapter: SupabaseStorageAdapter) {}

  public async upload(id: string, companyId: string, data: Buffer): Promise<string> {
    const payload: BackupPayload = {
      id,
      createdAt: new Date().toISOString(),
      checksum: '',
      encryptedData: data,
      iv: '',
      version: 1,
      companyId,
    };
    return this.adapter.upload(payload);
  }

  public async download(remoteKey: string): Promise<Buffer> {
    return this.adapter.download(remoteKey);
  }

  public async deleteRemote(remoteKey: string): Promise<void> {
    await this.adapter.remove(remoteKey);
  }

  public async listRemote(
    companyId: string,
  ): Promise<Array<{ id: string; remoteKey: string }>> {
    const snapshots = await this.adapter.listSnapshots(companyId);
    return snapshots.map((s) => ({ id: s.id, remoteKey: s.remoteKey ?? `${companyId}/${s.id}.enc` }));
  }
}

/**
 * NoopBackupUploader — used when Supabase is not configured. Uploads "fail"
 * (unreachable) so the caller enqueues for later draining; deletes are no-ops.
 */
export class NoopBackupUploader implements BackupUploader {
  public async upload(): Promise<string> {
    throw new Error('Cloud storage not configured');
  }
  public async download(): Promise<Buffer> {
    throw new Error('Cloud storage not configured');
  }
  public async deleteRemote(): Promise<void> {
    /* no-op */
  }
  public async listRemote(): Promise<Array<{ id: string; remoteKey: string }>> {
    return [];
  }
}
