import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'smart-retail-dev';
const SUPER_ADMIN_EMAIL = 'superadmin@pos.local';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2026';
const SUPER_ADMIN_MFA_SECRET = 'JBSWY3DPEHPK3PXP';

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

const data = {
  _id: crypto.randomUUID(),
  email: SUPER_ADMIN_EMAIL,
  role: 'super_admin',
  password_hash: createPasswordHash(SUPER_ADMIN_PASSWORD),
  mfa_secret: SUPER_ADMIN_MFA_SECRET,
  is_mfa_enrolled: true,
  is_active: true,
  failed_login_attempts: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

async function main() {
  const client = new MongoClient(mongoUrl, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection('platform_admins');
  try {
    const res = await col.updateOne({ email: SUPER_ADMIN_EMAIL }, { $setOnInsert: data }, { upsert: true });
    console.log('result', res);
  } catch (err) {
    console.error('ERROR', err);
    if (err?.errInfo?.details) console.error('details', JSON.stringify(err.errInfo.details, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
