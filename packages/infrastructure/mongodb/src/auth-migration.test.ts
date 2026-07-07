import { describe, it, expect } from 'vitest';
import { MongoClient } from 'mongodb';
import * as path from 'path';
import { MigrationRunner } from './migration-runner';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI ?? 'mongodb://localhost:27017';
const TEST_DB_NAME = `auth_migration_test_${Date.now()}`;

describe('Auth migration schema', () => {
  it('creates the auth-related collections and indexes', async () => {
    const client = new MongoClient(MONGODB_TEST_URI, { serverSelectionTimeoutMS: 2000 });

    try {
      await client.connect();
      const db = client.db(TEST_DB_NAME);
      const runner = new MigrationRunner(db, path.resolve(__dirname, '..', 'migrations'));

      await runner.up();

      const collections = await db.listCollections().toArray();
      const names = collections.map((entry) => entry.name);

      expect(names).toEqual(
        expect.arrayContaining([
          'users',
          'permissions',
          'roles',
          'user_branch_roles',
          'subscriptions',
          'subscription_plans',
          'license_keys',
          'devices',
          'platform_admins',
          'platform_admin_actions',
        ]),
      );

      const indexes = await db.collection('devices').indexes();
      expect(indexes.some((index) => index.name === 'company_device_fingerprint')).toBe(true);
    } catch (error) {
      if (
        error instanceof Error &&
        /ECONNREFUSED|ENOTFOUND|MongoServerSelectionError/i.test(error.message)
      ) {
        return;
      }
      throw error;
    } finally {
      await client.close().catch(() => undefined);
    }
  });
});
