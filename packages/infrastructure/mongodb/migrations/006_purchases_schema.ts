import { Db } from 'mongodb';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'purchase_orders',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'branch_id',
        'supplier_id',
        'reference_number',
        'status',
        'expected_delivery_date',
        'total_amount_piasters',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        branch_id: { bsonType: 'string' },
        supplier_id: { bsonType: 'string' },
        reference_number: { bsonType: 'string', minLength: 1 },
        status: {
          bsonType: 'string',
          enum: [
            'draft',
            'pending_approval',
            'approved',
            'partially_received',
            'fully_received',
            'cancelled',
          ],
        },
        expected_delivery_date: { bsonType: 'date' },
        total_amount_piasters: { bsonType: 'int', minimum: 0 },
        notes: { bsonType: 'string' },
        requested_by_user_id: { bsonType: 'string' },
        approved_by_user_id: { bsonType: 'string' },
        rejected_reason: { bsonType: 'string' },
        cancelled_reason: { bsonType: 'string' },
        hlc_timestamp: { bsonType: 'string' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, status: 1, created_at: 1 } },
      { key: { company_id: 1, supplier_id: 1 } },
    ],
  },
  {
    name: 'purchase_order_lines',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'purchase_order_id',
        'product_id',
        'unit_id',
        'ordered_quantity',
        'unit_price_piasters',
        'received_quantity',
        'line_total_piasters',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        purchase_order_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        unit_id: { bsonType: 'string' },
        ordered_quantity: { bsonType: 'int', minimum: 1 },
        unit_price_piasters: { bsonType: 'int', minimum: 0 },
        received_quantity: { bsonType: 'int', minimum: 0 },
        line_total_piasters: { bsonType: 'int', minimum: 0 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { purchase_order_id: 1 } }],
  },
  {
    name: 'goods_receipts',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'purchase_order_id',
        'received_by_user_id',
        'received_at',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        purchase_order_id: { bsonType: 'string' },
        received_by_user_id: { bsonType: 'string' },
        received_at: { bsonType: 'date' },
        notes: { bsonType: 'string' },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, purchase_order_id: 1 } },
      { key: { purchase_order_id: 1 } },
    ],
  },
  {
    name: 'goods_receipt_lines',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'goods_receipt_id',
        'purchase_order_line_id',
        'product_id',
        'warehouse_id',
        'received_quantity',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        goods_receipt_id: { bsonType: 'string' },
        purchase_order_line_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        variant_id: { bsonType: 'string' },
        warehouse_id: { bsonType: 'string' },
        received_quantity: { bsonType: 'int', minimum: 0 },
        discrepancy_type: {
          bsonType: 'string',
          enum: ['quantity_shortage', 'quality_rejection', 'wrong_item'],
        },
        discrepancy_notes: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { goods_receipt_id: 1 } }],
  },
  {
    name: 'goods_receipt_discrepancies',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'goods_receipt_id',
        'purchase_order_line_id',
        'type',
        'expected_quantity',
        'actual_quantity',
        'created_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        goods_receipt_id: { bsonType: 'string' },
        purchase_order_line_id: { bsonType: 'string' },
        type: {
          bsonType: 'string',
          enum: ['quantity_shortage', 'quality_rejection', 'wrong_item'],
        },
        expected_quantity: { bsonType: 'int', minimum: 0 },
        actual_quantity: { bsonType: 'int', minimum: 0 },
        notes: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { goods_receipt_id: 1 } }],
  },
  {
    name: 'supplier_invoices',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'purchase_order_id',
        'supplier_id',
        'invoice_number',
        'invoice_date',
        'total_amount_piasters',
        'tax_amount_piasters',
        'status',
        'created_at',
        'updated_at',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        purchase_order_id: { bsonType: 'string' },
        supplier_id: { bsonType: 'string' },
        invoice_number: { bsonType: 'string', minLength: 1 },
        invoice_date: { bsonType: 'date' },
        total_amount_piasters: { bsonType: 'int', minimum: 0 },
        tax_amount_piasters: { bsonType: 'int', minimum: 0 },
        attachment_url: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['pending', 'matched', 'disputed'],
        },
        hlc_timestamp: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, purchase_order_id: 1 } },
      { key: { company_id: 1, supplier_id: 1 } },
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
