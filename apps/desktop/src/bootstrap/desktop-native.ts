import { MongoConnection } from '@packages/infrastructure-mongodb/src/mongo-connection';
import { MigrationRunner } from '@packages/infrastructure-mongodb/src/migration-runner';
import { LocalDiskAdapter } from '@packages/infrastructure-backup/src/local-disk.adapter';
import {
  BackupQueue,
  InMemoryBackupQueueStorage,
} from '@packages/infrastructure-backup/src/backup-queue';
import { BackupScheduler } from '@packages/infrastructure-backup/src/backup-scheduler';
import { createSupabaseStorageAdapterFromEnv } from '@packages/infrastructure-backup/src/supabase-storage.config';
import type { SupabaseStorageAdapter } from '@packages/infrastructure-backup/src/supabase-storage.adapter';
import { logger } from '@packages/shared-kernel';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

export interface NativeDesktopStatus {
  dbConnected: boolean;
  encryptionActive: boolean;
}

export interface NativeDesktopContainer {
  mongoConnection: MongoConnection;
  backupScheduler: BackupScheduler;
  localDiskAdapter: LocalDiskAdapter;
  backupQueue: BackupQueue;
  supabaseStorageAdapter?: SupabaseStorageAdapter;
  supabaseBackupConfigured: boolean;
  dbConnected: boolean;
  encryptionActive: boolean;
}

export async function bootstrapNativeDesktop(): Promise<NativeDesktopContainer> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
  const mongoConnection = MongoConnection.getInstance(mongoUri, 'smart_retail_os');

  let dbConnected = false;
  let encryptionActive = false;

  try {
    await mongoConnection.connect();
    dbConnected = true;
    encryptionActive = true;

    const migrationsDir = path.resolve(
      __dirname,
      '../../../packages/infrastructure/mongodb/migrations',
    );
    const runner = new MigrationRunner(mongoConnection.db(), migrationsDir);
    await runner.up();
  } catch (err) {
    dbConnected = false;
    encryptionActive = false;
    logger.error('[DI] MongoDB connection failed', { error: String(err) });
  }

  const backupDir = path.join(process.env.APPDATA ?? os.homedir(), 'smart-retail-os', 'backups');
  const backupKey = Buffer.from(
    process.env.BACKUP_ENCRYPTION_KEY ?? crypto.randomBytes(32).toString('hex').slice(0, 64),
    'hex',
  );
  const localDiskAdapter = new LocalDiskAdapter(backupDir, backupKey);
  const backupQueue = new BackupQueue(new InMemoryBackupQueueStorage());
  const supabaseStorageAdapter = createSupabaseStorageAdapterFromEnv();
  const supabaseBackupConfigured = supabaseStorageAdapter !== null;

  const backupScheduler = new BackupScheduler(async () => {
    if (!supabaseStorageAdapter) {
      return;
    }
  });

  return {
    mongoConnection,
    backupScheduler,
    localDiskAdapter,
    backupQueue,
    supabaseStorageAdapter: supabaseStorageAdapter ?? undefined,
    supabaseBackupConfigured,
    dbConnected,
    encryptionActive,
  };
}
