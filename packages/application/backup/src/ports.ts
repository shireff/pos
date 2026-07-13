import {
  BackupManifestStorage,
  BackupDataSource,
  RestoreTarget,
  BackupKeyProvider,
  CleanupPolicy,
  RetentionConfig,
  BackupManifest,
  BackupType,
} from '@packages/infrastructure-backup';

/**
 * BackupFileStore — abstracts the local encrypted backup file lifecycle.
 * Implementations wrap the LocalDiskAdapter (gzip + AES-256-GCM).
 */
export interface BackupFileStore {
  write(
    companyId: string,
    rawData: Buffer,
    key: Buffer,
  ): Promise<{ id: string; checksum: string; size: number }>;
  readEncrypted(id: string): Buffer;
  readDecrypted(id: string, expectedChecksum: string, key: Buffer): Promise<Buffer>;
  existsLocal(id: string): boolean;
  deleteLocal(id: string): void;
}

/**
 * BackupUploader — uploads/downloads encrypted backups to Supabase Storage
 * (the secondary/cloud location). Failures are surfaced so callers can
 * enqueue the upload for later draining.
 */
export interface BackupUploader {
  upload(id: string, companyId: string, data: Buffer): Promise<string>;
  download(remoteKey: string): Promise<Buffer>;
  deleteRemote(remoteKey: string): Promise<void>;
  listRemote(companyId: string): Promise<Array<{ id: string; remoteKey: string }>>;
}

/**
 * BackupUploadQueue — durable offline queue of backups pending cloud upload.
 * Survives app restart and auto-drains on connectivity restore.
 */
export interface BackupUploadQueue {
  enqueue(manifest: BackupManifest, encryptedData: Buffer): Promise<void>;
  drain(upload: (manifest: BackupManifest, data: Buffer) => Promise<void>): Promise<void>;
  getPending(): Promise<Array<{ manifest: BackupManifest; data: Buffer }>>;
}

/** Bundle of all ports required by the backup use-case handlers. */
export interface BackupPorts {
  manifests: BackupManifestStorage;
  dataSource: BackupDataSource;
  restoreTarget: RestoreTarget;
  keyProvider: BackupKeyProvider;
  fileStore: BackupFileStore;
  uploader: BackupUploader;
  uploadQueue: BackupUploadQueue;
  cleanup: CleanupPolicy;
  retention: RetentionConfig;
}

export type { BackupManifest, BackupType };
