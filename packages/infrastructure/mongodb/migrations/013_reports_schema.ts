import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const DATE_STRING_SCHEMA = { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };

const DAILY_SALES_ROLLUP_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'branch_id', 'date'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    branch_id: { bsonType: 'string', minLength: 1 },
    date: DATE_STRING_SCHEMA,
    gross_revenue_piasters: { bsonType: 'int', minimum: 0 },
    tax_amount_piasters: { bsonType: 'int', minimum: 0 },
    discount_amount_piasters: { bsonType: 'int', minimum: 0 },
    transaction_count: { bsonType: 'int', minimum: 0 },
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const MONTHLY_SALES_ROLLUP_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'branch_id', 'year', 'month'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    branch_id: { bsonType: 'string', minLength: 1 },
    year: { bsonType: 'int', minimum: 2000, maximum: 2100 },
    month: { bsonType: 'int', minimum: 1, maximum: 12 },
    gross_revenue_piasters: { bsonType: 'int', minimum: 0 },
    tax_amount_piasters: { bsonType: 'int', minimum: 0 },
    discount_amount_piasters: { bsonType: 'int', minimum: 0 },
    transaction_count: { bsonType: 'int', minimum: 0 },
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const INVENTORY_VALUATION_SNAPSHOT_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'warehouse_id', 'product_id', 'snapshot_date'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    warehouse_id: { bsonType: 'string', minLength: 1 },
    product_id: { bsonType: 'string', minLength: 1 },
    variant_id: { bsonType: 'string' },
    batch_id: { bsonType: 'string' },
    quantity_on_hand: { bsonType: 'int', minimum: 0 },
    cost_price_piasters: { bsonType: 'int', minimum: 0 },
    total_value_piasters: { bsonType: 'int', minimum: 0 },
    snapshot_date: DATE_STRING_SCHEMA,
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const EMPLOYEE_PERFORMANCE_SNAPSHOT_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'branch_id', 'employee_id', 'date'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    branch_id: { bsonType: 'string', minLength: 1 },
    employee_id: { bsonType: 'string', minLength: 1 },
    shift_session_id: { bsonType: 'string' },
    date: DATE_STRING_SCHEMA,
    orders_handled: { bsonType: 'int', minimum: 0 },
    total_sales_piasters: { bsonType: 'int', minimum: 0 },
    total_returns_piasters: { bsonType: 'int', minimum: 0 },
    return_rate: { bsonType: 'double', minimum: 0 },
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const CUSTOMER_LOYALTY_SNAPSHOT_SCHEMA: Schema = {
  bsonType: 'object',
  required: ['_id', 'company_id', 'customer_id', 'snapshot_date'],
  properties: {
    _id: { bsonType: 'string' },
    company_id: { bsonType: 'string', minLength: 1 },
    customer_id: { bsonType: 'string', minLength: 1 },
    tier: { bsonType: 'string' },
    total_points_earned: { bsonType: 'int', minimum: 0 },
    total_points_redeemed: { bsonType: 'int', minimum: 0 },
    current_balance: { bsonType: 'int', minimum: 0 },
    snapshot_date: DATE_STRING_SCHEMA,
    created_at: { bsonType: 'date' },
    updated_at: { bsonType: 'date' },
  },
  additionalProperties: false,
};

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'daily_sales_rollup',
    schema: DAILY_SALES_ROLLUP_SCHEMA,
    indexes: [
      { key: { company_id: 1, branch_id: 1, date: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'monthly_sales_rollup',
    schema: MONTHLY_SALES_ROLLUP_SCHEMA,
    indexes: [
      { key: { company_id: 1, branch_id: 1, year: 1, month: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'inventory_valuation_snapshot',
    schema: INVENTORY_VALUATION_SNAPSHOT_SCHEMA,
    indexes: [
      { key: { company_id: 1, warehouse_id: 1, product_id: 1, snapshot_date: 1 } },
    ],
  },
  {
    name: 'employee_performance_snapshot',
    schema: EMPLOYEE_PERFORMANCE_SNAPSHOT_SCHEMA,
    indexes: [
      { key: { company_id: 1, branch_id: 1, employee_id: 1, date: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'customer_loyalty_snapshot',
    schema: CUSTOMER_LOYALTY_SNAPSHOT_SCHEMA,
    indexes: [
      { key: { company_id: 1, customer_id: 1, snapshot_date: 1 }, options: { unique: true } },
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
