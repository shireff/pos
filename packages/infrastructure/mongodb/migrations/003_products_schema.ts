import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'products',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'sku', 'status', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string', minLength: 1 },
        description: { bsonType: 'string' },
        sku: { bsonType: 'string' },
        barcode: { bsonType: 'string' },
        category_id: { bsonType: 'string' },
        base_unit_id: { bsonType: 'string' },
        status: { bsonType: 'string', enum: ['active', 'archived'] },
        cost_price_piasters: { bsonType: 'int', minimum: 0 },
        selling_price_piasters: { bsonType: 'int', minimum: 0 },
        is_bundle: { bsonType: 'bool' },
        is_serialized: { bsonType: 'bool' },
        requires_batch_tracking: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by_device_id: { bsonType: 'string' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, sku: 1 }, options: { unique: true } },
      { key: { company_id: 1, barcode: 1 }, options: { unique: true, sparse: true } },
      { key: { company_id: 1, status: 1 } },
      { key: { category_id: 1 } },
    ],
  },
  {
    name: 'product_variants',
    schema: {
      bsonType: 'object',
      required: ['_id', 'product_id', 'sku', 'price_piasters', 'cost_piasters', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        sku: { bsonType: 'string' },
        barcode: { bsonType: 'string' },
        name: { bsonType: 'string' },
        additional_price_piasters: { bsonType: 'int', minimum: 0 },
        attributes_json: { bsonType: 'object' },
        price_piasters: { bsonType: 'int', minimum: 0 },
        cost_piasters: { bsonType: 'int', minimum: 0 },
        is_deleted: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { product_id: 1 } },
      { key: { sku: 1 }, options: { unique: true, sparse: true } },
      { key: { barcode: 1 }, options: { unique: true, sparse: true } },
    ],
  },
  {
    name: 'product_units',
    schema: {
      bsonType: 'object',
      required: ['_id', 'product_id', 'unit_name', 'conversion_factor_to_base', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        unit_name: { bsonType: 'string' },
        abbreviation: { bsonType: 'string' },
        is_base_unit: { bsonType: 'bool' },
        conversion_factor_to_base: { bsonType: 'int', minimum: 1 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { product_id: 1, unit_name: 1 }, options: { unique: true } }],
  },
  {
    name: 'bundle_components',
    schema: {
      bsonType: 'object',
      required: ['_id', 'bundle_product_id', 'component_product_id', 'quantity', 'deduction_ratio'],
      properties: {
        _id: { bsonType: 'string' },
        bundle_product_id: { bsonType: 'string' },
        component_product_id: { bsonType: 'string' },
        quantity: { bsonType: 'int', minimum: 1 },
        deduction_ratio: { bsonType: 'double', minimum: 0, maximum: 1 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { bundle_product_id: 1 } },
      { key: { component_product_id: 1 } },
    ],
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
