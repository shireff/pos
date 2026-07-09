import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'warehouses',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        branch_id: { bsonType: 'string' },
        name: { bsonType: 'string', minLength: 1 },
        address: { bsonType: 'string' },
        is_default: { bsonType: 'bool' },
        is_active: { bsonType: 'bool' },
        manager_id: { bsonType: 'string' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1 } },
      { key: { company_id: 1, name: 1 }, options: { unique: true } },
      { key: { branch_id: 1 } },
    ],
  },
  {
    name: 'batches',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'product_id', 'variant_id', 'warehouse_id', 'batch_number', 'quantity_remaining', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        warehouse_id: { bsonType: 'string' },
        batch_number: { bsonType: 'string' },
        expiry_date: { bsonType: 'date' },
        manufacturing_date: { bsonType: 'date' },
        cost_price_piasters: { bsonType: 'int', minimum: 0 },
        quantity_remaining: { bsonType: 'int', minimum: 0 },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, product_id: 1, variant_id: 1, warehouse_id: 1 } },
      { key: { company_id: 1, warehouse_id: 1, expiry_date: 1 } },
      { key: { company_id: 1, batch_number: 1 }, options: { unique: true } },
    ],
  },
  {
    name: 'stock_movement_events',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'warehouse_id', 'product_id', 'event_type', 'quantity', 'occurred_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        warehouse_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        batch_id: { bsonType: 'string' },
        event_type: {
          bsonType: 'string',
          enum: ['SALE', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'PURCHASE_RECEIPT', 'EXPIRY_WRITE_OFF', 'DAMAGE_WRITE_OFF', 'BUNDLE_DEDUCTION', 'CORRECTION'],
        },
        quantity: { bsonType: 'int' },
        reference_type: { bsonType: 'string' },
        reference_id: { bsonType: 'string' },
        originating_device_id: { bsonType: 'string' },
        sequence_no: { bsonType: 'long' },
        causality_vector: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, product_id: 1, warehouse_id: 1 } },
      { key: { company_id: 1, warehouse_id: 1, occurred_at: 1 } },
      { key: { company_id: 1, reference_type: 1, reference_id: 1 } },
    ],
  },
  {
    name: 'stock_items',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'product_id', 'warehouse_id', 'quantity_on_hand', 'reserved_quantity', 'reorder_point', 'reorder_quantity', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        warehouse_id: { bsonType: 'string' },
        batch_id: { bsonType: 'string' },
        quantity_on_hand: { bsonType: 'int', minimum: 0 },
        reserved_quantity: { bsonType: 'int', minimum: 0 },
        reorder_point: { bsonType: 'int', minimum: 0 },
        reorder_quantity: { bsonType: 'int', minimum: 0 },
        updated_from_sequence: { bsonType: 'long' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, product_id: 1, variant_id: 1, warehouse_id: 1 }, options: { unique: true } },
      { key: { company_id: 1, warehouse_id: 1 } },
      { key: { company_id: 1, product_id: 1 } },
    ],
  },
  {
    name: 'stock_transfers',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'from_warehouse_id', 'to_warehouse_id', 'status', 'requested_by_user_id', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        from_warehouse_id: { bsonType: 'string' },
        to_warehouse_id: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['draft', 'pending_approval', 'approved', 'shipped', 'received', 'cancelled'],
        },
        requested_by_user_id: { bsonType: 'string' },
        approved_by_user_id: { bsonType: 'string' },
        shipped_at: { bsonType: 'date' },
        received_at: { bsonType: 'date' },
        cancelled_at: { bsonType: 'date' },
        notes: { bsonType: 'string' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, status: 1, created_at: 1 } },
      { key: { company_id: 1, from_warehouse_id: 1 } },
      { key: { company_id: 1, to_warehouse_id: 1 } },
    ],
  },
  {
    name: 'stock_transfer_lines',
    schema: {
      bsonType: 'object',
      required: ['_id', 'transfer_id', 'product_id', 'quantity_requested', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        transfer_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        batch_id: { bsonType: 'string' },
        quantity_requested: { bsonType: 'int', minimum: 1 },
        quantity_shipped: { bsonType: 'int', minimum: 0 },
        quantity_received: { bsonType: 'int', minimum: 0 },
        notes: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { transfer_id: 1 } },
      { key: { company_id: 1 } },
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
        // ignore
      }
    }
    for (const idx of indexes ?? []) {
      try {
        await db.collection(name).createIndex(idx.key, idx.options);
      } catch {
        // ignore
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
