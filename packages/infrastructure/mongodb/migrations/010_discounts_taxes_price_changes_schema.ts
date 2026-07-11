import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const DISCOUNT_RULE_TYPE_ENUM = ['item', 'cart', 'category', 'customer', 'membership', 'time_based', 'buy_x_get_y', 'quantity_break'];
const COUPON_DISCOUNT_TYPE_ENUM = ['percentage', 'fixed'];
const COUPON_SCOPE_TYPE_ENUM = ['global', 'product', 'category'];
const PRICE_CHANGE_STATUS_ENUM = ['pending_approval', 'approved', 'rejected'];

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'discount_rules',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'type', 'rule_json', 'is_active', 'valid_from', 'priority', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        name: { bsonType: 'string', minLength: 1 },
        type: { bsonType: 'string', enum: DISCOUNT_RULE_TYPE_ENUM },
        rule_json: { bsonType: 'object' },
        is_active: { bsonType: 'bool' },
        valid_from: { bsonType: 'date' },
        valid_until: { bsonType: 'date' },
        priority: { bsonType: 'int', minimum: 0 },
        is_exclusive: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, is_active: 1, type: 1 } },
    ],
  },
  {
    name: 'coupons',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'code', 'discount_type', 'amount', 'is_active', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        code: { bsonType: 'string', minLength: 1 },
        discount_type: { bsonType: 'string', enum: COUPON_DISCOUNT_TYPE_ENUM },
        amount: { bsonType: 'int', minimum: 1 },
        is_multi_use: { bsonType: 'bool' },
        usage_limit: { bsonType: 'int', minimum: 1 },
        expires_at: { bsonType: 'date' },
        scope_type: { bsonType: 'string', enum: COUPON_SCOPE_TYPE_ENUM },
        scope_ids: { bsonType: 'array', items: { bsonType: 'string' } },
        is_active: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, code: 1 }, options: { unique: true } },
      { key: { company_id: 1, expires_at: 1 } },
    ],
  },
  {
    name: 'coupon_usages',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'coupon_id', 'order_id', 'used_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        coupon_id: { bsonType: 'string', minLength: 1 },
        order_id: { bsonType: 'string', minLength: 1 },
        used_by_user_id: { bsonType: 'string', minLength: 1 },
        used_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { coupon_id: 1, order_id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'tax_rules',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'rate_percent', 'applicable_to', 'priority', 'is_active', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        name: { bsonType: 'string', minLength: 1 },
        rate_percent: { bsonType: 'int', minimum: 0, maximum: 100 },
        applicable_to: { bsonType: 'string', enum: ['all', 'category', 'product'] },
        scope_ids: { bsonType: 'array', items: { bsonType: 'string' } },
        priority: { bsonType: 'int', minimum: 0 },
        is_active: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, priority: 1 } },
    ],
  },
  {
    name: 'price_changes',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'product_id', 'old_price_piasters', 'new_price_piasters', 'status', 'requested_by_user_id', 'requested_at', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        product_id: { bsonType: 'string', minLength: 1 },
        variant_id: { bsonType: 'string' },
        old_price_piasters: { bsonType: 'int', minimum: 0 },
        new_price_piasters: { bsonType: 'int', minimum: 0 },
        requested_by_user_id: { bsonType: 'string', minLength: 1 },
        approved_by_user_id: { bsonType: 'string' },
        status: { bsonType: 'string', enum: PRICE_CHANGE_STATUS_ENUM },
        notes: { bsonType: 'string' },
        requested_at: { bsonType: 'date' },
        approved_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, product_id: 1, status: 1 } },
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
