import { MongoConnection } from '@packages/infrastructure-mongodb/src/mongo-connection';
import { MigrationRunner } from '@packages/infrastructure-mongodb/src/migration-runner';
import { LocalDiskAdapter } from '@packages/infrastructure-backup/src/local-disk.adapter';
import {
  BackupQueue,
  InMemoryBackupQueueStorage,
} from '@packages/infrastructure-backup/src/backup-queue';
import { BackupScheduler } from '@packages/infrastructure-backup/src/backup-scheduler';
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
    // Log error — in production this goes to structured logger
    // eslint-disable-next-line no-console
    console.error('[DI] MongoDB connection failed:', err);
  }

  // Backup infrastructure
  const backupDir = path.join(process.env.APPDATA ?? os.homedir(), 'smart-retail-os', 'backups');
  const backupKey = Buffer.from(
    process.env.BACKUP_ENCRYPTION_KEY ?? crypto.randomBytes(32).toString('hex').slice(0, 64),
    'hex',
  );
  const localDiskAdapter = new LocalDiskAdapter(backupDir, backupKey);
  const backupQueue = new BackupQueue(new InMemoryBackupQueueStorage());
  const backupScheduler = new BackupScheduler(async () => {
    // Phase 01: scheduler wired; actual backup body implemented in Phase 17 (Desktop Shell full)
  });

  return {
    mongoConnection,
    backupScheduler,
    localDiskAdapter,
    backupQueue,
    dbConnected,
    encryptionActive,
  };
}
