import { Db } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

function loadSchema(name: string): Schema {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, '..', 'schemas', name), 'utf-8')) as Schema;
}

const NOTIFICATIONS_SCHEMA = loadSchema('notifications.schema.json');
const NOTIFICATION_PREFERENCES_SCHEMA = loadSchema('notification_preferences.schema.json');
const NOTIFICATION_RATE_LIMITS_SCHEMA = loadSchema('notification_rate_limits.schema.json');
const NOTIFICATION_DIGESTS_SCHEMA = loadSchema('notification_digests.schema.json');

/**
 * Migration 014 — Notifications schema (Phase 14).
 *
 * Creates the centralized notification store and supporting collections:
 *  - notifications: in-app notification store (source of truth, every channel has one)
 *  - notification_preferences: per-user / per-category / per-channel enablement
 *  - notification_rate_limits: sliding-window state (TTL auto-expiry)
 *  - notification_digests: batched MEDIUM (hourly) / LOW (daily) digests
 */
const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'notifications',
    schema: NOTIFICATIONS_SCHEMA,
    indexes: [
      { key: { company_id: 1, recipient_user_id: 1, is_read: 1, created_at: -1 } },
      { key: { company_id: 1, recipient_user_id: 1, created_at: -1 } },
    ],
  },
  {
    name: 'notification_preferences',
    schema: NOTIFICATION_PREFERENCES_SCHEMA,
    indexes: [
      {
        key: { user_id: 1, category: 1, channel: 1 },
        options: { unique: true },
      },
    ],
  },
  {
    name: 'notification_rate_limits',
    schema: NOTIFICATION_RATE_LIMITS_SCHEMA,
    indexes: [
      // TTL index: documents auto-expire once the window ends (auto-prune rate-limit state).
      { key: { window_ends_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { user_id: 1, category: 1, window_starts_at: 1 } },
    ],
  },
  {
    name: 'notification_digests',
    schema: NOTIFICATION_DIGESTS_SCHEMA,
    indexes: [
      { key: { company_id: 1, recipient_user_id: 1, frequency: 1, period_end: -1 } },
    ],
  },
];

export const up = async (db: Db): Promise<void> => {
  for (const { name, schema, indexes } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      await db.createCollection(name, {
        validator: { $jsonSchema: schema },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    } else {
      try {
        await db.command({
          collMod: name,
          validator: { $jsonSchema: schema },
          validationLevel: 'moderate',
          validationAction: 'error',
        });
      } catch {
        // collection already aligned
      }
    }
    for (const idx of indexes ?? []) {
      try {
        await db.collection(name).createIndex(idx.key, idx.options);
      } catch {
        // index may already exist
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) continue;
    try {
      await db.command({ collMod: name, validator: {}, validationLevel: 'off' });
    } catch {
      // ignore
    }
    await db.dropCollection(name).catch(() => undefined);
  }
};
