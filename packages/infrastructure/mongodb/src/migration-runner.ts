import * as fs from 'fs';
import * as path from 'path';
import { Db } from 'mongodb';
import { fileURLToPath, pathToFileURL } from 'url';

const MIGRATIONS_COLLECTION = '_migrations';

interface MigrationEntry {
  name: string;
  appliedAt: Date;
}

interface MigrationModule {
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

interface Migration extends MigrationModule {
  name: string;
}

/**
 * MigrationRunner applies versioned, idempotent migrations to MongoDB.
 * Tracks applied migrations in the `_migrations` collection.
 *
 * Migration files must export `up(db: Db)` and `down(db: Db)` functions.
 *
 * Uses dynamic import() instead of require() so it works correctly in ESM
 * packages ("type": "module") where require() of .ts/.js ES modules fails.
 */
export class MigrationRunner {
  private readonly db: Db;
  private readonly migrationsDir: string;

  public constructor(db: Db, migrationsDir?: string) {
    this.db = db;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.migrationsDir = migrationsDir ?? path.resolve(__dirname, '..', 'migrations');
  }

  /**
   * Runs all pending migrations in alphabetical (numbered) order.
   * Safe to run multiple times — idempotent.
   */
  public async up(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const available = await this.loadAvailableMigrations();

    for (const migration of available) {
      if (!applied.includes(migration.name)) {
        console.log(`  applying migration: ${migration.name}`);
        await migration.up(this.db);
        await this.recordMigration(migration.name);
        console.log(`  ✓ ${migration.name}`);
      } else {
        console.log(`  skipping (already applied): ${migration.name}`);
      }
    }
  }

  /**
   * Rolls back the last applied migration.
   */
  public async down(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    if (applied.length === 0) {
      console.log('  nothing to roll back');
      return;
    }

    const lastMigrationName = applied[applied.length - 1];
    const available = await this.loadAvailableMigrations();
    const migration = available.find((m) => m.name === lastMigrationName);

    if (!migration) {
      throw new Error(`Migration not found for rollback: ${lastMigrationName}`);
    }

    console.log(`  rolling back: ${lastMigrationName}`);
    await migration.down(this.db);
    await this.removeMigrationRecord(lastMigrationName);
    console.log(`  ✓ rolled back ${lastMigrationName}`);
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

  /**
   * Loads all migration files from migrationsDir using dynamic import() so
   * ES module files (in a "type":"module" package) load correctly.
   * Files are sorted alphabetically to guarantee execution order.
   */
  private async loadAvailableMigrations(): Promise<Migration[]> {
    if (!fs.existsSync(this.migrationsDir)) return [];

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.js') || f.endsWith('.ts'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      // pathToFileURL ensures the path is a valid file:// URL on Windows
      // (backslashes in require() paths cause issues in ESM loaders).
      const fileUrl = pathToFileURL(filePath).href;
      const mod = (await import(fileUrl)) as MigrationModule;
      migrations.push({
        name: file.replace(/\.[jt]s$/, ''),
        up: mod.up,
        down: mod.down,
      });
    }

    return migrations;
  }
}
