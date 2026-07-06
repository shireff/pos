import * as fs from 'fs';
import * as path from 'path';
import { Db } from 'mongodb';

const MIGRATIONS_COLLECTION = '_migrations';

interface MigrationEntry {
  name: string;
  appliedAt: Date;
}

interface Migration {
  name: string;
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

/**
 * MigrationRunner applies versioned, idempotent migrations to MongoDB.
 * Tracks applied migrations in the `_migrations` collection.
 */
export class MigrationRunner {
  private readonly db: Db;
  private readonly migrationsDir: string;

  public constructor(db: Db, migrationsDir?: string) {
    this.db = db;
    this.migrationsDir = migrationsDir ?? path.resolve(__dirname, '..', 'migrations');
  }

  /**
   * Runs all pending migrations in alphabetical (numbered) order.
   * Safe to run multiple times (idempotent).
   */
  public async up(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const available = this.loadAvailableMigrations();

    for (const migration of available) {
      if (!applied.includes(migration.name)) {
        await migration.up(this.db);
        await this.recordMigration(migration.name);
      }
    }
  }

  /**
   * Rolls back the last applied migration.
   */
  public async down(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    if (applied.length === 0) return;

    const lastMigrationName = applied[applied.length - 1];
    const available = this.loadAvailableMigrations();
    const migration = available.find((m) => m.name === lastMigrationName);

    if (!migration) {
      throw new Error(`Migration not found for rollback: ${lastMigrationName}`);
    }

    await migration.down(this.db);
    await this.removeMigrationRecord(lastMigrationName);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const coll = this.db.collection<MigrationEntry>(MIGRATIONS_COLLECTION);
    const entries = await coll.find({}).sort({ appliedAt: 1 }).toArray();
    return entries.map((e) => e.name);
  }

  private async recordMigration(name: string): Promise<void> {
    const coll = this.db.collection<MigrationEntry>(MIGRATIONS_COLLECTION);
    await coll.insertOne({ name, appliedAt: new Date() });
  }

  private async removeMigrationRecord(name: string): Promise<void> {
    const coll = this.db.collection<MigrationEntry>(MIGRATIONS_COLLECTION);
    await coll.deleteOne({ name });
  }

  private loadAvailableMigrations(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) return [];

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.js') || f.endsWith('.ts'))
      .sort();

    return files.map((file) => {
      const filePath = path.join(this.migrationsDir, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(filePath) as Migration;
      return {
        name: file.replace(/\.[jt]s$/, ''),
        up: mod.up,
        down: mod.down,
      };
    });
  }
}
