import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = {
  key: Record<string, number>;
  options?: Record<string, unknown>;
};

const ORDER_STATUS_ENUM = [
  'pending',
  'completed',
  'partially_returned',
  'fully_returned',
  'voided',
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

const RETURN_STATUS_ENUM = ['pending_approval', 'approved', 'rejected'];

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'orders',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'branch_id',
        'cashier_id',
        'client_txn_id',
        'status',
        'grand_total',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        branch_id: { bsonType: 'string', minLength: 1 },
        cashier_id: { bsonType: 'string', minLength: 1 },
        client_txn_id: { bsonType: 'string', minLength: 1 },
        shift_session_id: { bsonType: 'string' },
        customer_id: { bsonType: 'string' },
        status: { bsonType: 'string', enum: ORDER_STATUS_ENUM },
        subtotal: { bsonType: 'int', minimum: 0 },
        discount_total: { bsonType: 'int', minimum: 0 },
        tax_total: { bsonType: 'int', minimum: 0 },
        // totalAmount must be positive for a completed sale (BR-SAL-002)
        grand_total: { bsonType: 'int', minimum: 1 },
        hlc_timestamp: { bsonType: 'string' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, branch_id: 1, status: 1, created_at: 1 } },
      { key: { company_id: 1, client_txn_id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'order_lines',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'order_id',
        'product_variant_id',
        'quantity',
        'unit_price_piasters',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        order_id: { bsonType: 'string', minLength: 1 },
        product_variant_id: { bsonType: 'string', minLength: 1 },
        batch_id: { bsonType: 'string' },
        quantity: { bsonType: 'int', minimum: 1 },
        unit_price_piasters: { bsonType: 'int', minimum: 0 },
        discount_amount_piasters: { bsonType: 'int', minimum: 0 },
        tax_amount_piasters: { bsonType: 'int', minimum: 0 },
        cost_snapshot_piasters: { bsonType: 'int', minimum: 0 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { order_id: 1 } }],
  },
  {
    name: 'payments',
    schema: {
      bsonType: 'object',
      required: ['_id', 'order_id', 'company_id', 'tender_type', 'amount_piasters'],
      properties: {
        _id: { bsonType: 'string' },
        order_id: { bsonType: 'string', minLength: 1 },
        company_id: { bsonType: 'string', minLength: 1 },
        // tenderType enum
        tender_type: { bsonType: 'string', enum: TENDER_TYPE_ENUM },
        // amount positive (BR-SAL-004)
        amount_piasters: { bsonType: 'int', minimum: 1 },
        provider_reference: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { order_id: 1 } },
      { key: { company_id: 1, created_at: 1 } },
    ],
  },
  {
    name: 'returns',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'original_order_id',
        'returned_by_user_id',
        'status',
        'refund_amount_piasters',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        original_order_id: { bsonType: 'string', minLength: 1 },
        returned_by_user_id: { bsonType: 'string', minLength: 1 },
        approved_by_user_id: { bsonType: 'string' },
        reason: { bsonType: 'string', minLength: 5 },
        refund_method: { bsonType: 'string' },
        status: { bsonType: 'string', enum: RETURN_STATUS_ENUM },
        refund_amount_piasters: { bsonType: 'int', minimum: 0 },
        voided_order_id: { bsonType: 'string' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { original_order_id: 1 } },
      { key: { company_id: 1, status: 1, created_at: 1 } },
    ],
  },
  {
    name: 'return_lines',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'return_id',
        'original_order_line_id',
        'product_variant_id',
        'quantity',
        'refund_amount_piasters',
      ],
      properties: {
        _id: { bsonType: 'string' },
        return_id: { bsonType: 'string', minLength: 1 },
        original_order_line_id: { bsonType: 'string', minLength: 1 },
        product_variant_id: { bsonType: 'string', minLength: 1 },
        batch_id: { bsonType: 'string' },
        quantity: { bsonType: 'int', minimum: 1 },
        refund_amount_piasters: { bsonType: 'int', minimum: 0 },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { return_id: 1 } }],
  },
  {
    name: 'shift_sessions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'branch_id', 'cashier_id', 'status'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string', minLength: 1 },
        branch_id: { bsonType: 'string', minLength: 1 },
        cashier_id: { bsonType: 'string', minLength: 1 },
        opened_at: { bsonType: 'date' },
        closed_at: { bsonType: 'date' },
        opening_cash_piasters: { bsonType: 'int', minimum: 0 },
        closing_cash_piasters: { bsonType: 'int', minimum: 0 },
        status: { bsonType: 'string', enum: ['open', 'closed'] },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { company_id: 1, branch_id: 1, cashier_id: 1, status: 1 } }],
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
