/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoClient, Db } from 'mongodb';
import { MigrationRunner } from './migration-runner';
import * as path from 'path';

/**
 * Integration tests for MigrationRunner.
 * Requires a running MongoDB instance at MONGODB_TEST_URI (defaults to localhost:27017).
 * Tests are skipped automatically when MongoDB is not available.
 */
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI ?? 'mongodb://localhost:27017';
const TEST_DB_NAME = 'migration_test_' + Date.now();
const CONNECT_TIMEOUT_MS = 2000;

let client: MongoClient | null = null;
let db: Db | null = null;
let mongoAvailable = false;

describe('MigrationRunner Integration Tests', () => {
  beforeAll(async () => {
    try {
      client = new MongoClient(MONGODB_TEST_URI, { serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS });
      await client.connect();
      db = client.db(TEST_DB_NAME);
      mongoAvailable = true;
    } catch {
      mongoAvailable = false;
    }
  }, 5000);

  afterAll(async () => {
    if (!mongoAvailable) return;
    try {
      await db?.dropDatabase();
      await client?.close();
    } catch {
      // Best effort cleanup
    }
  });

  beforeEach(async () => {
    if (!mongoAvailable || !db) return;
    try {
      await db.collection('_migrations').deleteMany({});
    } catch {
      // ignore
    }
  });

  it('applies 001_initial_schema.ts cleanly on fresh DB', async () => {
    if (!mongoAvailable || !db) {
      console.log('[SKIP] MongoDB not available — skipping integration test');
      return;
    }

    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.up();

    const applied = await db.collection('_migrations').find({}).toArray();
    expect(applied.length).toBeGreaterThanOrEqual(1);
    expect(applied.some((entry) => entry.name === '001_initial_schema')).toBe(true);
  });

  it('is idempotent — running runner.up() twice does not error', async () => {
    if (!mongoAvailable || !db) {
      console.log('[SKIP] MongoDB not available — skipping integration test');
      return;
    }

    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.up();
    await runner.up(); // Second run should be no-op

    const applied = await db.collection('_migrations').find({}).toArray();
    const migrationNames = applied.map((m) => m.name);
    const uniqueNames = [...new Set(migrationNames)];
    expect(migrationNames.length).toBe(uniqueNames.length);
  });

  it('records applied migrations in the _migrations collection', async () => {
    if (!mongoAvailable || !db) {
      console.log('[SKIP] MongoDB not available');
      return;
    }

    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.up();

    const record = await db.collection('_migrations').findOne({ name: '001_initial_schema' });
    expect(record).toBeTruthy();
    expect(record?.appliedAt).toBeInstanceOf(Date);
  });

  it('rolling back a migration removes the record from _migrations', async () => {
    if (!mongoAvailable || !db) {
      console.log('[SKIP] MongoDB not available');
      return;
    }

    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.up();

    const beforeRollback = await db.collection('_migrations').find({}).toArray();
    expect(beforeRollback.length).toBeGreaterThanOrEqual(1);

    await runner.down();

    const afterRollback = await db.collection('_migrations').find({}).toArray();
    expect(afterRollback.length).toBe(beforeRollback.length - 1);
  });
});
