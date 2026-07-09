import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'platform_admins',
    schema: {
      bsonType: 'object',
      required: ['_id', 'email', 'role', 'password_hash', 'is_mfa_enrolled', 'is_active', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        email: { bsonType: 'string' },
        role: { bsonType: 'string', enum: ['super_admin', 'support'] },
        password_hash: { bsonType: 'string' },
        mfa_secret: { bsonType: 'string' },
        is_mfa_enrolled: { bsonType: 'bool' },
        is_active: { bsonType: 'bool' },
        failed_login_attempts: { bsonType: 'int', minimum: 0 },
        locked_until: { bsonType: ['date', 'null'] },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { email: 1 }, options: { unique: true } }],
  },
  {
    name: 'platform_admin_actions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'admin_id', 'action', 'reason', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        admin_id: { bsonType: 'string' },
        action: { bsonType: 'string' },
        reason: { bsonType: 'string', minLength: 1 },
        metadata_json: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { admin_id: 1, created_at: -1 } }],
  },
];

export const up = async (db: Db): Promise<void> => {
  for (const { name, schema, indexes } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      await db.createCollection(name, { validator: { $jsonSchema: schema }, validationLevel: 'moderate', validationAction: 'error' });
    } else {
      try { await db.command({ collMod: name, validator: { $jsonSchema: schema }, validationLevel: 'moderate', validationAction: 'error' }); } catch { /* ignore */ }
    }
    for (const idx of indexes ?? []) {
      try { await db.collection(name).createIndex(idx.key, idx.options); } catch { /* ignore */ }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    try { await db.command({ collMod: name, validator: {}, validationLevel: 'off' }); } catch { /* ignore */ }
  }
};
