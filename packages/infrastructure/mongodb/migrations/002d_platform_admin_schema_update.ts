import { Db } from 'mongodb';

type Schema = Record<string, unknown>;

const COLLECTION_NAME = 'platform_admins';

const UPDATED_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'email', 'role', 'password_hash', 'is_active', 'is_mfa_enrolled', 'created_at', 'updated_at'],
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
};

const ORIGINAL_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'email', 'role', 'password_hash', 'is_active', 'created_at'],
  properties: {
    _id: { bsonType: 'string' },
    email: { bsonType: 'string' },
    role: { bsonType: 'string', enum: ['super_admin', 'support'] },
    password_hash: { bsonType: 'string' },
    mfa_secret: { bsonType: 'string' },
    is_active: { bsonType: 'bool' },
    failed_login_attempts: { bsonType: 'int', minimum: 0 },
    locked_until: { bsonType: 'date' },
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

export const up = async (db: Db): Promise<void> => {
  const existing = await db.listCollections({ name: COLLECTION_NAME }).toArray();
  if (existing.length === 0) {
    await db.createCollection(COLLECTION_NAME, {
      validator: { $jsonSchema: UPDATED_SCHEMA },
      validationLevel: 'moderate',
      validationAction: 'error',
    });
    return;
  }
  await db.command({ collMod: COLLECTION_NAME, validator: { $jsonSchema: UPDATED_SCHEMA }, validationLevel: 'moderate', validationAction: 'error' });
};

export const down = async (db: Db): Promise<void> => {
  const existing = await db.listCollections({ name: COLLECTION_NAME }).toArray();
  if (existing.length === 0) return;
  await db.command({ collMod: COLLECTION_NAME, validator: { $jsonSchema: ORIGINAL_SCHEMA }, validationLevel: 'moderate', validationAction: 'error' });
};
