import { Db } from 'mongodb';

type Schema = Record<string, unknown>;

const COLLECTIONS: Array<{ name: string; schema: Schema }> = [
  {
    name: 'permissions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'code', 'module', 'action', 'is_system'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        code: { bsonType: 'string' },
        module: { bsonType: 'string' },
        action: { bsonType: 'string' },
        description: { bsonType: 'string' },
        is_system: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'roles',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'is_system_role'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        is_system_role: { bsonType: 'bool' },
        permission_ids: { bsonType: 'array' },
        is_deleted: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'user_branch_roles',
    schema: {
      bsonType: 'object',
      required: ['_id', 'user_id', 'branch_id', 'role_id'],
      properties: {
        _id: { bsonType: 'string' },
        user_id: { bsonType: 'string' },
        branch_id: { bsonType: 'string' },
        role_id: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'subscriptions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'status', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        plan_id: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['trial', 'active', 'suspended', 'trial_expired', 'cancelled'],
        },
        trial_started_at: { bsonType: 'date' },
        trial_ends_at: { bsonType: 'date' },
        activated_at: { bsonType: 'date' },
        suspended_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'subscription_plans',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'tier', 'is_active', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        tier: { bsonType: 'string', enum: ['trial', 'starter', 'growth', 'enterprise'] },
        monthly_price_piasters: { bsonType: 'int', minimum: 0 },
        annual_price_piasters: { bsonType: 'int', minimum: 0 },
        max_users: { bsonType: 'int', minimum: 1 },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'license_keys',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'key', 'is_used', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        key: { bsonType: 'string' },
        plan_id: { bsonType: 'string' },
        is_used: { bsonType: 'bool' },
        expires_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'devices',
    schema: {
      bsonType: 'object',
      required: [
        '_id', 'company_id', 'device_type', 'device_fingerprint',
        'registered_at', 'last_seen_at', 'is_revoked',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        device_type: { bsonType: 'string', enum: ['desktop', 'android'] },
        device_fingerprint: { bsonType: 'string' },
        registered_at: { bsonType: 'date' },
        last_seen_at: { bsonType: 'date' },
        is_revoked: { bsonType: 'bool' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'platform_admins',
    schema: {
      bsonType: 'object',
      required: ['_id', 'email', 'role', 'password_hash', 'is_active', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string' },
        email: { bsonType: 'string' },
        role: { bsonType: 'string', enum: ['super_admin', 'support'] },
        password_hash: { bsonType: 'string' },
        mfa_secret: { bsonType: 'string' },
        is_active: { bsonType: 'bool' },
        failed_login_attempts: { bsonType: 'int', minimum: 0 },
        locked_until: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'platform_admin_actions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'admin_id', 'action', 'reason', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        admin_id: { bsonType: 'string' },
        action: { bsonType: 'string' },
        reason: { bsonType: 'string' },
        metadata_json: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
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
        eta_enabled: { bsonType: 'bool' },
        is_deleted: { bsonType: 'bool' },
        sync_version: { bsonType: 'int' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
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
      },
    },
  },
  {
    name: 'stock_movement_events',
    schema: {
      bsonType: 'object',
      required: ['_id', 'warehouse_id', 'product_variant_id', 'event_type', 'quantity_delta', 'occurred_at'],
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
      required: ['_id', 'aggregate_type', 'aggregate_id', 'event_payload_json', 'created_at', 'device_id'],
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
      required: ['_id', 'company_id', 'actor_user_id', 'action_code', 'entity_type', 'entity_id', 'occurred_at'],
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

  await db.collection('users').createIndex({ company_id: 1 });
  await db.collection('permissions').createIndex({ company_id: 1, code: 1 }, { unique: true });
  await db.collection('roles').createIndex({ company_id: 1, name: 1 });
  await db.collection('user_branch_roles').createIndex({ user_id: 1, branch_id: 1 });
  await db.collection('subscriptions').createIndex({ company_id: 1 }, { unique: true });
  await db.collection('subscription_plans').createIndex({ company_id: 1, tier: 1 });
  await db.collection('license_keys').createIndex({ company_id: 1, key: 1 }, { unique: true });
  await db.collection('devices').createIndex(
    { company_id: 1, device_fingerprint: 1 },
    { unique: true, name: 'company_device_fingerprint' },
  );
  await db.collection('platform_admins').createIndex({ email: 1 }, { unique: true });
  await db.collection('platform_admin_actions').createIndex({ admin_id: 1, created_at: -1 });
  await db.collection('products').createIndex({ company_id: 1 });
  await db.collection('orders').createIndex({ branch_id: 1, created_at: -1 });
  await db.collection('stock_movement_events').createIndex({
    warehouse_id: 1, product_variant_id: 1, sequence_no: 1,
  });
  await db.collection('sync_outbox').createIndex(
    { device_id: 1, sent_at: 1 },
    { sparse: true, name: 'pending_outbox' },
  );
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length > 0) {
      await db.dropCollection(name);
    }
  }
};
