import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const SUPPLIER_LEDGER_EVENT_TYPE_ENUM = ['invoice', 'payment', 'credit_note', 'return_debit', 'adjustment'];

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'suppliers',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'phone', 'is_active', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        name: {
          bsonType: 'object',
          required: ['ar'],
          properties: {
            ar: { bsonType: 'string', minLength: 1 },
            en: { bsonType: 'string' },
          },
        },
        phone: { bsonType: 'string', minLength: 1 },
        email: { bsonType: 'string' },
        address: { bsonType: 'string' },
        tax_id: { bsonType: 'string' },
        payment_terms_days: { bsonType: 'int', minimum: 0 },
        currency: { bsonType: 'string', minLength: 3, maxLength: 3 },
        is_active: { bsonType: 'bool' },
        contacts: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['name', 'phone'],
            properties: {
              name: { bsonType: 'string', minLength: 1 },
              phone: { bsonType: 'string', minLength: 1 },
              email: { bsonType: 'string' },
              role: { bsonType: 'string' },
            },
          },
        },
        sync_version: { bsonType: 'int' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, is_active: 1 } },
    ],
  },
  {
    name: 'supplier_ledger_entries',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'supplier_id', 'event_type', 'amount_piasters', 'occurred_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        supplier_id: { bsonType: 'string', minLength: 1 },
        event_type: { bsonType: 'string', enum: SUPPLIER_LEDGER_EVENT_TYPE_ENUM },
        amount_piasters: { bsonType: 'int' },
        reference_type: { bsonType: 'string' },
        reference_id: { bsonType: 'string' },
        notes: { bsonType: 'string' },
        occurred_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { supplier_id: 1, occurred_at: 1 } },
    ],
  },
  {
    name: 'supplier_price_history',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'supplier_id', 'product_id', 'unit_price_piasters', 'effective_date', 'recorded_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        supplier_id: { bsonType: 'string', minLength: 1 },
        product_id: { bsonType: 'string', minLength: 1 },
        variant_id: { bsonType: 'string' },
        unit_price_piasters: { bsonType: 'int', minimum: 0 },
        effective_date: { bsonType: 'date' },
        recorded_at: { bsonType: 'date' },
        purchase_order_id: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { supplier_id: 1, product_id: 1, recorded_at: 1 } },
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
        // ignore — collection already aligned
      }
    }
    for (const idx of indexes ?? []) {
      try {
        await db.collection(name).createIndex(idx.key, idx.options);
      } catch {
        // ignore — index may already exist
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    try {
      await db.command({ collMod: name, validator: {}, validationLevel: 'off' });
    } catch {
      // ignore
    }
  }
};
