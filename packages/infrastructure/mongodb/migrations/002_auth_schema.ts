import { Db, Document } from 'mongodb';

type IndexDefinition = {
  key: Record<string, number | string>;
  options?: Record<string, unknown>;
};

const COLLECTIONS: Array<{ name: string; schema: Document; indexes?: IndexDefinition[] }> = [
  {
    name: 'companies',
    schema: {
      bsonType: 'object',
      required: ['_id', 'name', 'default_currency', 'default_language', 'timezone', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        name: { bsonType: 'string', minLength: 1 },
        business_type: { bsonType: 'string' },
        default_currency: { bsonType: 'string', minLength: 3 },
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
    indexes: [{ key: { name: 1 }, options: { unique: true } }],
  },
  {
    name: 'branches',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        address: { bsonType: 'string' },
        working_hours_override: { bsonType: 'object' },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, name: 1 }, options: { unique: true } },
      { key: { company_id: 1 } },
    ],
  },
  {
    name: 'warehouses',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        company_id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        address: { bsonType: 'string' },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { company_id: 1, name: 1 }, options: { unique: true } }],
  },
  {
    name: 'users',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'created_at'],
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
      additionalProperties: false,
    },
    indexes: [
      { key: { company_id: 1, email: 1 }, options: { unique: true, sparse: true } },
      { key: { company_id: 1, phone: 1 }, options: { sparse: true } },
    ],
  },
  {
    name: 'roles',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'name', 'is_system_role', 'created_at'],
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
    indexes: [{ key: { company_id: 1, name: 1 }, options: { unique: true } }],
  },
  {
    name: 'permissions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'company_id', 'code', 'module', 'action', 'is_system', 'created_at'],
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
    indexes: [{ key: { company_id: 1, code: 1 }, options: { unique: true } }],
  },
  {
    name: 'role_permissions',
    schema: {
      bsonType: 'object',
      required: ['_id', 'role_id', 'permission_id', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        role_id: { bsonType: 'string' },
        permission_id: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { role_id: 1, permission_id: 1 }, options: { unique: true } }],
  },
  {
    name: 'user_branch_roles',
    schema: {
      bsonType: 'object',
      required: ['_id', 'user_id', 'branch_id', 'role_id', 'created_at'],
      properties: {
        _id: { bsonType: 'string' },
        user_id: { bsonType: 'string' },
        branch_id: { bsonType: 'string' },
        role_id: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
    indexes: [{ key: { user_id: 1, branch_id: 1, role_id: 1 }, options: { unique: true } }],
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
        // ignore collMod failures on older servers
      }
    }

    if (indexes && indexes.length) {
      for (const idx of indexes) {
        try {
          await db.collection(name).createIndex(idx.key, idx.options || undefined);
        } catch (err) {
          // index may already exist with different options
        }
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  // don't drop collections in down; instead relax validators
  for (const { name } of COLLECTIONS) {
    try {
      await db.command({ collMod: name, validator: {}, validationLevel: 'off' });
    } catch (err) {
      // ignore
    }
  }
};
