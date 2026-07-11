import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = {
  key: Record<string, number>;
  options?: Record<string, unknown>;
};

const PAYMENT_TRANSACTION_STATUS_ENUM = [
  'pending',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
];

const TENDER_TYPE_ENUM = [
  'cash',
  'card',
  'vodafone_cash',
  'orange_cash',
  'etisalat_cash',
  'we_pay',
  'instapay',
  'bank_transfer',
  'customer_credit',
  'store_credit',
];

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'payment_methods',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'tender_type', 'is_enabled', 'display_name_ar', 'display_name_en'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        tender_type: { bsonType: 'string', enum: TENDER_TYPE_ENUM },
        is_enabled: { bsonType: 'bool' },
        display_name_ar: { bsonType: 'string', minLength: 1 },
        display_name_en: { bsonType: 'string', minLength: 1 },
        configuration: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, tender_type: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'payment_transactions',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'order_id',
        'tender_type',
        'amount_piasters',
        'status',
        'created_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        order_id: { bsonType: 'string', minLength: 1 },
        tender_type: { bsonType: 'string', enum: TENDER_TYPE_ENUM },
        amount_piasters: { bsonType: 'int', minimum: 1 },
        provider_id: { bsonType: 'string' },
        status: { bsonType: 'string', enum: PAYMENT_TRANSACTION_STATUS_ENUM },
        external_reference: { bsonType: 'string' },
        processed_at: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { order_id: 1 } },
      { key: { company_id: 1, created_at: 1 } },
      { key: { company_id: 1, tender_type: 1, status: 1 } },
    ],
  },
  {
    name: 'payment_provider_registry',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'provider_name', 'provider_type', 'configuration_schema'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        provider_name: { bsonType: 'string', minLength: 1 },
        provider_type: { bsonType: 'string', minLength: 1 },
        configuration_schema: { bsonType: 'object' },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, provider_name: 1 }, options: { unique: true } },
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
