import { Db, Document, CreateIndexesOptions, IndexSpecification } from 'mongodb';

type IndexDefinition = {
  key: IndexSpecification;
  options?: CreateIndexesOptions;
};

const COLLECTIONS: Array<{ name: string; schema: Document; indexes?: IndexDefinition[] }> = [
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
          enum: ['trialing', 'active', 'past_due', 'locked', 'canceled', 'suspended'],
        },
        trial_started_at: { bsonType: 'date' },
        trial_ends_at: { bsonType: 'date' },
        activated_at: { bsonType: 'date' },
        suspended_at: { bsonType: 'date' },
        lock_reason: { bsonType: 'string' },
        entitlement_override: { bsonType: 'object' },
        grace_period_ends_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { company_id: 1 }, options: { unique: true } }, { key: { trial_ends_at: 1 } }],
  },
  {
    name: 'subscription_plans',
    schema: {
      bsonType: 'object',
      required: ['_id', 'code', 'name', 'is_active', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        code: { bsonType: 'string' },
        name: { bsonType: 'string' },
        monthly_price_piasters: { bsonType: 'int', minimum: 0 },
        annual_price_piasters: { bsonType: 'int', minimum: 0 },
        max_users: { bsonType: ['int', 'null'] },
        feature_flags: { bsonType: 'object' },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { code: 1 }, options: { unique: true } }],
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
        grace_period_ends_at: { bsonType: 'date' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { company_id: 1, key: 1 }, options: { unique: true } }],
  },
  {
    name: 'devices',
    schema: {
      bsonType: 'object',
      required: [
        '_id',
        'company_id',
        'device_type',
        'device_fingerprint',
        'registered_at',
        'last_seen_at',
        'is_revoked',
      ],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        device_type: { bsonType: 'string', enum: ['desktop', 'android'] },
        device_fingerprint: { bsonType: 'string' },
        registered_at: { bsonType: 'date' },
        last_seen_at: { bsonType: 'date' },
        is_revoked: { bsonType: 'bool' },
        metadata: { bsonType: 'object' },
      },
      additionalProperties: false,
    },
    indexes: [
      {
        key: { company_id: 1, device_fingerprint: 1 },
        options: { unique: true, name: 'company_device_fingerprint' },
      },
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
      } catch (err) {
        // ignore
      }
    }

    if (indexes && indexes.length) {
      for (const idx of indexes) {
        try {
          await db.collection(name).createIndex(idx.key, idx.options || undefined);
        } catch (err) {
          // ignore index errors
        }
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    try {
      await db.command({ collMod: name, validator: {}, validationLevel: 'off' });
    } catch (err) {
      // ignore
    }
  }
};
