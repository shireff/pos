import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'categories',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'level', 'path', 'sort_order', 'is_deleted', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: {
          bsonType: 'object',
          required: ['ar'],
          properties: { ar: { bsonType: 'string', minLength: 1 }, en: { bsonType: 'string' } },
          additionalProperties: false,
        },
        parent_id: { bsonType: ['string', 'null'] },
        level: { bsonType: 'int', minimum: 0 },
        path: { bsonType: 'string', minLength: 1 },
        sort_order: { bsonType: 'int', minimum: 0 },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, parent_id: 1 } },
      { key: { company_id: 1, path: 1 } },
    ],
  },
  {
    name: 'units',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'abbreviation', 'is_base_unit', 'conversion_factor_to_base', 'is_deleted', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: {
          bsonType: 'object',
          required: ['ar'],
          properties: { ar: { bsonType: 'string', minLength: 1 }, en: { bsonType: 'string' } },
          additionalProperties: false,
        },
        abbreviation: { bsonType: 'string', minLength: 1 },
        is_base_unit: { bsonType: 'bool' },
        conversion_factor_to_base: { bsonType: 'double', minimum: 0, exclusiveMinimum: true },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { company_id: 1, abbreviation: 1 }, options: { unique: true } }],
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
