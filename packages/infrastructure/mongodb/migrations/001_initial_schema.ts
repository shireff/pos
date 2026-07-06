import { Db, Document } from 'mongodb';

const COLLECTIONS: Array<{ name: string; schema: Document }> = [
  {
    name: 'companies',
    schema: {
      bsonType: 'object',
      required: ['_id', 'name', 'default_currency', 'default_language', 'timezone'],
      properties: {
        _id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        business_type: { bsonType: 'string' },
        default_currency: { bsonType: 'string' },
        default_language: { bsonType: 'string', enum: ['ar', 'en'] },
        timezone: { bsonType: 'string' },
        subscription_tier: { bsonType: 'string' },
        eta_enabled: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by_device_id: { bsonType: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'users',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password_hash: { bsonType: 'string' },
        is_active: { bsonType: 'bool' },
        default_branch_id: { bsonType: 'string' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by_device_id: { bsonType: 'string' },
      },
    },
  },
  {
    name: 'products',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        category_id: { bsonType: 'string' },
        base_unit_id: { bsonType: 'string' },
        is_bundle: { bsonType: 'bool' },
        is_serialized: { bsonType: 'bool' },
        requires_batch_tracking: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by_device_id: { bsonType: 'string' },
      },
    },
  },
  {
    name: 'orders',
    schema: {
      bsonType: 'object',
      required: ['_id', 'branch_id', 'cashier_id', 'status', 'grand_total'],
      properties: {
        _id: { bsonType: 'string' },
        branch_id: { bsonType: 'string' },
        cashier_id: { bsonType: 'string' },
        customer_id: { bsonType: 'string' },
        status: { bsonType: 'string' },
        subtotal: { bsonType: 'int', minimum: 0 },
        discount_total: { bsonType: 'int', minimum: 0 },
        tax_total: { bsonType: 'int', minimum: 0 },
        grand_total: { bsonType: 'int', minimum: 0 },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by_device_id: { bsonType: 'string' },
      },
    },
  },
  {
    name: 'stock_movement_events',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'warehouse_id',
        'product_variant_id',
        'event_type',
        'quantity_delta',
        'occurred_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        warehouse_id: { bsonType: 'string' },
        product_variant_id: { bsonType: 'string' },
        batch_id: { bsonType: 'string' },
        event_type: {
          bsonType: 'string',
          enum: ['SALE', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'PURCHASE_RECEIPT'],
        },
        quantity_delta: { bsonType: 'int' },
        occurred_at: { bsonType: 'date' },
        originating_device_id: { bsonType: 'string' },
        sequence_no: { bsonType: 'long' },
        causality_vector: { bsonType: 'object' },
        reference_type: { bsonType: 'string' },
        reference_id: { bsonType: 'string' },
      },
    },
  },
  {
    name: 'sync_outbox',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'aggregate_type',
        'aggregate_id',
        'event_payload_json',
        'created_at',
        'device_id',
      ],
      properties: {
        _id: { bsonType: 'string' },
        aggregate_type: { bsonType: 'string' },
        aggregate_id: { bsonType: 'string' },
        event_payload_json: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        sent_at: { bsonType: 'date' },
        device_id: { bsonType: 'string' },
      },
    },
  },
  {
    name: 'audit_entries',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'actor_user_id',
        'action_code',
        'entity_type',
        'entity_id',
        'occurred_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        actor_user_id: { bsonType: 'string' },
        action_code: { bsonType: 'string' },
        entity_type: { bsonType: 'string' },
        entity_id: { bsonType: 'string' },
        before_json: { bsonType: 'string' },
        after_json: { bsonType: 'string' },
        occurred_at: { bsonType: 'date' },
        device_id: { bsonType: 'string' },
      },
    },
  },
];

export const up = async (db: Db): Promise<void> => {
  for (const { name, schema } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      await db.createCollection(name, {
        validator: { $jsonSchema: schema },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    }
  }

  // Create indexes per Database.md §6
  const companyId = await db.createCollection('companies').catch(() => db.collection('companies'));
  await db.collection('users').createIndex({ company_id: 1 });
  await db.collection('products').createIndex({ company_id: 1 });
  await db.collection('orders').createIndex({ branch_id: 1, created_at: -1 });
  await db
    .collection('stock_movement_events')
    .createIndex({ warehouse_id: 1, product_variant_id: 1, sequence_no: 1 });
  await db
    .collection('sync_outbox')
    .createIndex({ device_id: 1, sent_at: 1 }, { sparse: true, name: 'pending_outbox' });
  void companyId; // suppress unused var
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length > 0) {
      await db.dropCollection(name);
    }
  }
};
