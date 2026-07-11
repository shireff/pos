import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = {
  key: Record<string, number>;
  options?: Record<string, unknown>;
};

const LOYALTY_EVENT_TYPE_ENUM = ['accrual', 'redemption', 'reversal', 'expiry', 'adjustment'];

const CREDIT_EVENT_TYPE_ENUM = ['purchase_on_credit', 'payment', 'credit_note', 'adjustment'];

const LOYALTY_TIER_ENUM = ['bronze', 'silver', 'gold', 'platinum'];

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'customers',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'phone', 'loyalty_code', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        name: { bsonType: 'string', minLength: 1 },
        phone: { bsonType: 'string', minLength: 1 },
        email: { bsonType: 'string' },
        loyalty_code: { bsonType: 'string', minLength: 1 },
        loyalty_tier_id: { bsonType: 'string', enum: LOYALTY_TIER_ENUM },
        credit_limit_piasters: { bsonType: 'int', minimum: 0 },
        is_active: { bsonType: 'bool' },
        notes: { bsonType: 'string' },
        sync_version: { bsonType: 'int' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, phone: 1 }, options: { unique: true } },
      { key: { company_id: 1, loyalty_code: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'loyalty_accounts',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'customer_id', 'points_balance', 'tier_id', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        customer_id: { bsonType: 'string', minLength: 1 },
        points_balance: { bsonType: 'int', minimum: 0 },
        tier_id: { bsonType: 'string', enum: LOYALTY_TIER_ENUM },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, customer_id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'loyalty_events',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'customer_id', 'event_type', 'amount_points', 'occurred_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        customer_id: { bsonType: 'string', minLength: 1 },
        event_type: { bsonType: 'string', enum: LOYALTY_EVENT_TYPE_ENUM },
        amount_points: { bsonType: 'int', minimum: 1 },
        reference_type: { bsonType: 'string' },
        reference_id: { bsonType: 'string' },
        occurred_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { customer_id: 1, occurred_at: 1 } },
    ],
  },
  {
    name: 'credit_ledger_entries',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'customer_id', 'event_type', 'amount_piasters', 'occurred_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        customer_id: { bsonType: 'string', minLength: 1 },
        event_type: { bsonType: 'string', enum: CREDIT_EVENT_TYPE_ENUM },
        amount_piasters: { bsonType: 'int' },
        reference_type: { bsonType: 'string' },
        reference_id: { bsonType: 'string' },
        payment_method: { bsonType: 'string' },
        reference_number: { bsonType: 'string' },
        occurred_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { customer_id: 1, occurred_at: 1 } },
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
