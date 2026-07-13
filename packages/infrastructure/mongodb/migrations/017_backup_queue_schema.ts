import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const MANIFESTS_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'type', 'checksum', 'encryption_key_id', 'created_at', 'verified'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string' },
    created_at: { bsonType: 'date' },
    type: { enum: ['full', 'incremental'] },
    collections: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        required: ['name', 'rowCount'],
        properties: {
          name: { bsonType: 'string' },
          rowCount: { bsonType: 'int' },
        },
      },
    },
    checksum: { bsonType: 'string' },
    encryption_key_id: { bsonType: 'string' },
    size: { bsonType: 'int' },
    source: { enum: ['local', 'remote'] },
    remote_key: { bsonType: 'string' },
    verified: { bsonType: 'bool' },
    deleted: { bsonType: 'bool' },
    deleted_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const QUEUE_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'metadata', 'encrypted_data_base64', 'enqueued_at', 'attempts'],
  properties: {
    _id: { bsonType: 'string' },
    metadata: { bsonType: 'object' },
    encrypted_data_base64: { bsonType: 'string' },
    enqueued_at: { bsonType: 'date' },
    attempts: { bsonType: 'int' },
  },
  additionalProperties: false,
};

/**
 * Migration 017 — Backup & Restore schema (Phase 17).
 *
 * Creates the backup bookkeeping collections:
 *  - _backup_manifests: authoritative metadata for every backup (local + remote)
 *  - _backup_queue: durable offline queue of backups pending Supabase upload
 */
const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: '_backup_manifests',
    schema: MANIFESTS_SCHEMA,
    indexes: [
      { key: { company_id: 1, created_at: -1 } },
      { key: { company_id: 1, deleted: 1 } },
    ],
  },
  {
    name: '_backup_queue',
    schema: QUEUE_SCHEMA,
    indexes: [{ key: { enqueued_at: 1 } }],
  },
];

export const up = async (db: Db): Promise<void> => {
  for (const { name, schema, indexes } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      await db.createCollection(name, {
        validator: { $jsonSchema: schema },
        validationLevel: 'moderate',
      });
    }
    if (indexes) {
      for (const idx of indexes) {
        await db.collection(name).createIndex(idx.key, idx.options ?? {});
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  await db.dropCollection('_backup_manifests').catch(() => undefined);
  await db.dropCollection('_backup_queue').catch(() => undefined);
};
