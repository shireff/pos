/**
 * Fix: Add catalog.view + sales.* permissions to Cashier role
 * Cashiers need to see products to make sales.
 */
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
for (const l of env.split('\n')) {
  const t = l.trim();
  if (!t || t[0] === '#') continue;
  const e = t.indexOf('=');
  if (e < 0) continue;
  const k = t.slice(0, e).trim(), v = t.slice(e + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const COMPANY_ID = 'demo-company-001';
const ROLE_ID    = 'demo-role-cashier';

// Permissions the Cashier needs for the POS/Catalog UI
const MISSING_PERMS = [
  'catalog.view',
  'inventory.view',
];

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB_NAME || 'pos');

// 1. Find permission IDs for the missing codes
const permDocs = await db.collection('permissions').find({
  company_id: COMPANY_ID,
  code: { $in: MISSING_PERMS },
}).toArray();

console.log(`Found ${permDocs.length} missing permission docs:`, permDocs.map(p => p.code));

if (permDocs.length === 0) {
  // Permissions don't exist yet — insert them
  const now = new Date();
  for (const code of MISSING_PERMS) {
    const id = `perm-${COMPANY_ID}-${code.replace(/\./g, '-')}`;
    const [module, ...rest] = code.split('.');
    try {
      await db.collection('permissions').insertOne({
        _id: id,
        company_id: COMPANY_ID,
        code,
        module,
        action: rest.join('.'),
        is_system: true,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      });
      console.log('Created permission:', code);
    } catch (err) {
      if (err.code !== 11000) throw err;
      console.log('Permission already exists:', code);
    }
  }
}

// Re-fetch after potential insert
const allPermDocs = await db.collection('permissions').find({
  company_id: COMPANY_ID,
  code: { $in: MISSING_PERMS },
}).toArray();

const permIds = allPermDocs.map(p => String(p._id));
console.log('Permission IDs to add:', permIds);

// 2. Add permission_ids to cashier role
const role = await db.collection('roles').findOne({ _id: ROLE_ID });
if (!role) { console.error('Cashier role not found'); await client.close(); process.exit(1); }

const existingIds = (role.permission_ids || []);
const toAdd = permIds.filter(id => !existingIds.includes(id));

if (toAdd.length > 0) {
  await db.collection('roles').updateOne(
    { _id: ROLE_ID },
    { $addToSet: { permission_ids: { $each: toAdd } } },
  );
  console.log('Added to role:', toAdd);
}

// 3. Add role_permissions join records
const now = new Date();
for (const permId of toAdd) {
  const rpId = `rp-${ROLE_ID}-${permId}`;
  try {
    await db.collection('role_permissions').insertOne({
      _id: rpId,
      role_id: ROLE_ID,
      permission_id: permId,
      created_at: now,
    });
    console.log('Created role_permission:', rpId);
  } catch (err) {
    if (err.code !== 11000) throw err;
    console.log('role_permission already exists:', rpId);
  }
}

console.log('\n✅ Cashier permissions updated. Users must logout and login again to get new JWT.');
await client.close();
