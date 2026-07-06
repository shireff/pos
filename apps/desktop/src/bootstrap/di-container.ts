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

/**
 * Desktop DI container — wires all infrastructure adapters for the Tauri shell.
 * Called once at app startup; all singletons are initialized here.
 */
export interface DesktopContainer {
  mongoConnection: MongoConnection;
  backupScheduler: BackupScheduler;
  localDiskAdapter: LocalDiskAdapter;
  backupQueue: BackupQueue;
  supabaseStorageAdapter?: SupabaseStorageAdapter;
  supabaseBackupConfigured: boolean;
  dbConnected: boolean;
  encryptionActive: boolean;
}

export async function bootstrapDesktop(): Promise<DesktopContainer> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
  const mongoConnection = MongoConnection.getInstance(mongoUri, 'smart_retail_os');

  let dbConnected = false;
  let encryptionActive = false;

  try {
    await mongoConnection.connect();
    dbConnected = true;
    encryptionActive = true;

    // Apply pending migrations
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

  // Backup infrastructure
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
    // Phase 01: scheduler wired; actual backup body implemented in Phase 17 (Desktop Shell full)
    // Supabase adapter is available when SUPABASE_URL and SUPABASE_KEY are configured.
    if (!supabaseStorageAdapter) {
      return;
    }

    // The backup queue and scheduler are configured. Actual upload support can be added in
    // the desktop backup implementation once encrypted backup payload creation is available.
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
