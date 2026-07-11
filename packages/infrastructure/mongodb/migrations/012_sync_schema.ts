import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

/**
 * Migration 012 — Offline Sync collections (Phase 12).
 *
 * Creates the sync engine collections:
 *  - sync_outbox: pending events queued for push (per device)
 *  - sync_inbox: received events queued for apply (per device)
 *  - sync_conflicts: detected concurrent edit conflicts for manual resolution
 *  - applied_events_cache: idempotency set of already-applied eventIds
 */

const SYNC_OUTBOX_SCHEMA: Schema = {
  bsonType: 'object',
  required: [
    '_id',
    'event_id',
    'event_type',
    'payload',
    'company_id',
    'device_id',
    'status',
    'hlc_timestamp',
    'created_at',
  ],
  properties: {
    _id: { bsonType: 'string' },
    event_id: { bsonType: 'string' },
    event_type: { bsonType: 'string', minLength: 1 },
    payload: { bsonType: 'object' },
    company_id: { bsonType: 'string', minLength: 1 },
    device_id: { bsonType: 'string', minLength: 1 },
    status: { bsonType: 'string', enum: ['pending', 'sent', 'acknowledged'] },
    hlc_timestamp: { bsonType: 'string' },
    created_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const SYNC_INBOX_SCHEMA: Schema = {
  bsonType: 'object',
  required: [
    '_id',
    'event_id',
    'event_type',
    'payload',
    'company_id',
    'source_device_id',
    'status',
    'hlc_timestamp',
    'received_at',
  ],
  properties: {
    _id: { bsonType: 'string' },
    event_id: { bsonType: 'string' },
    event_type: { bsonType: 'string', minLength: 1 },
    payload: { bsonType: 'object' },
    company_id: { bsonType: 'string', minLength: 1 },
    source_device_id: { bsonType: 'string', minLength: 1 },
    status: { bsonType: 'string', enum: ['pending', 'applied', 'conflict'] },
    hlc_timestamp: { bsonType: 'string' },
    received_at: { bsonType: 'date' },
    applied_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const SYNC_CONFLICTS_SCHEMA: Schema = {
  bsonType: 'object',
  required: [
    '_id',
    'entity_type',
    'entity_id',
    'field',
    'local_value',
    'remote_value',
    'local_hlc',
    'remote_hlc',
    'status',
    'created_at',
  ],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    entity_type: { bsonType: 'string', minLength: 1 },
    entity_id: { bsonType: 'string', minLength: 1 },
    field: { bsonType: 'string', minLength: 1 },
    local_value: {},
    remote_value: {},
    local_hlc: { bsonType: 'string' },
    remote_hlc: { bsonType: 'string' },
    status: {
      bsonType: 'string',
      enum: ['unresolved', 'resolved_local', 'resolved_remote', 'resolved_merge'],
    },
    resolved_by: { bsonType: ['string', 'null'] },
    resolved_at: { bsonType: ['date', 'null'] },
    audit_trail: { bsonType: 'array' },
    created_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const APPLIED_EVENTS_CACHE_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'event_id', 'company_id', 'device_id', 'applied_at'],
  properties: {
    _id: { bsonType: 'string' },
    event_id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    device_id: { bsonType: 'string', minLength: 1 },
    applied_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'sync_outbox',
    schema: SYNC_OUTBOX_SCHEMA,
    indexes: [
      { key: { company_id: 1, device_id: 1, status: 1, created_at: 1 } },
      { key: { event_id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'sync_inbox',
    schema: SYNC_INBOX_SCHEMA,
    indexes: [
      { key: { company_id: 1, device_id: 1, status: 1, received_at: 1 } },
      { key: { event_id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'sync_conflicts',
    schema: SYNC_CONFLICTS_SCHEMA,
    indexes: [{ key: { company_id: 1, entity_type: 1, entity_id: 1, status: 1 } }],
  },
  {
    name: 'applied_events_cache',
    schema: APPLIED_EVENTS_CACHE_SCHEMA,
    indexes: [{ key: { company_id: 1, device_id: 1, event_id: 1 }, options: { unique: true } }],
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
