import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BackupPayload, BackupMetadata } from './backup-payload';

export interface SupabaseStorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
  bucketName: string;
}

/**
 * SupabaseStorageAdapter uploads encrypted backup files to Supabase Storage.
 * When offline, it returns a queue-pending state and does NOT throw —
 * the caller should enqueue the upload via BackupQueue.
 */
export class SupabaseStorageAdapter {
  private readonly client: SupabaseClient;
  private readonly bucketName: string;

  public constructor(config: SupabaseStorageConfig, supabaseClient?: SupabaseClient) {
    this.client = supabaseClient ?? createClient(config.supabaseUrl, config.supabaseKey);
    this.bucketName = config.bucketName;
  }

  /**
   * Uploads an encrypted backup payload to Supabase Storage.
   * Returns the storage path if successful.
   * @throws if network call fails (caller should catch and enqueue via BackupQueue).
   */
  public async upload(payload: BackupPayload): Promise<string> {
    const storageKey = `${payload.companyId}/${payload.id}.enc`;

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(storageKey, payload.encryptedData, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return storageKey;
  }

  /**
   * Downloads an encrypted backup file from Supabase Storage.
   * @param remoteKey — the storage path returned from upload()
   */
  public async download(remoteKey: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucketName).download(remoteKey);

    if (error || !data) {
      throw new Error(`Supabase download failed: ${error?.message ?? 'No data returned'}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Deletes an encrypted backup file from Supabase Storage.
   * @param remoteKey — the storage path returned from upload()
   */
  public async remove(remoteKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucketName).remove([remoteKey]);

    if (error) {
      throw new Error(`Supabase remove failed: ${error.message}`);
    }
  }

  /**
   * Lists remote backup snapshots for a given company.
   */
  public async listSnapshots(companyId: string): Promise<BackupMetadata[]> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .list(companyId, { sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      throw new Error(`Supabase list failed: ${error.message}`);
    }

    return (data ?? []).map((file: { name: string; created_at: string | null }) => ({
      id: file.name.replace('.enc', ''),
      createdAt: file.created_at ?? new Date().toISOString(),
      checksum: '',
      companyId,
      version: 1,
      remoteKey: `${companyId}/${file.name}`,
    }));
  }
}
