import * as os from 'os';
import * as path from 'path';
import { Db } from 'mongodb';
import {
  BackupKeyProvider,
  EnvFileSecretStore,
  CleanupPolicy,
  DEFAULT_RETENTION,
  createSupabaseStorageAdapterFromEnv,
} from '@packages/infrastructure-backup';
import type { BackupPorts } from '@packages/application-backup';
import { isSupabaseConfigured } from '../cloud-db';
import { MongoBackupManifestStorage } from './mongo-backup-manifest-storage';
import { MongoBackupDataSource } from './mongo-backup-data-source';
import { MongoBackupRestoreTarget } from './mongo-backup-restore-target';
import { MongoBackupUploadQueue } from './mongo-backup-upload-queue';
import { LocalBackupFileStore } from './local-backup-file-store';
import { SupabaseBackupUploader, NoopBackupUploader } from './supabase-backup-uploader';

/**
 * createBackupPorts — assembles all backup use-case ports against MongoDB,
 * local disk, and (optionally) Supabase Storage.
 */
export function createBackupPorts(db: Db): BackupPorts {
  const backupDir =
    process.env.BACKUP_DIR ?? path.resolve(os.homedir(), '.smart_retail_os', 'backups');

  const keyProvider = new BackupKeyProvider(new EnvFileSecretStore());
  const fileStore = new LocalBackupFileStore(backupDir, keyProvider);

  const supabaseAdapter = isSupabaseConfigured() ? createSupabaseStorageAdapterFromEnv() : null;
  const uploader = supabaseAdapter
    ? new SupabaseBackupUploader(supabaseAdapter)
    : new NoopBackupUploader();

  return {
    manifests: new MongoBackupManifestStorage(db),
    dataSource: new MongoBackupDataSource(db),
    restoreTarget: new MongoBackupRestoreTarget(db),
    keyProvider,
    fileStore,
    uploader,
    uploadQueue: new MongoBackupUploadQueue(db),
    cleanup: new CleanupPolicy(DEFAULT_RETENTION),
    retention: DEFAULT_RETENTION,
  };
}
