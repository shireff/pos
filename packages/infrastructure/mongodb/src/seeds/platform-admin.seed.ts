/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

const SUPER_ADMIN_EMAIL = 'superadmin@pos.local';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2026';
const SUPER_ADMIN_MFA_SECRET = 'JBSWY3DPEHPK3PXP';

function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function seed(db: any) {
  const col = db.collection('platform_admins');
  const now = new Date();

  const seedDocument: Record<string, unknown> = {
    _id: crypto.randomUUID(),
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    password_hash: createPasswordHash(SUPER_ADMIN_PASSWORD),
    mfa_secret: SUPER_ADMIN_MFA_SECRET,
    is_mfa_enrolled: true,
    is_active: true,
    failed_login_attempts: 0,
    // MongoDB $jsonSchema bsonType ['date','null'] requires a BSON null,
    // not a JS undefined. Omitting the field satisfies 'moderate' validation.
    created_at: now,
    updated_at: now,
  };

  // Always upsert with $set so re-running the seed fixes a stale hash.
  const { _id, email, ...setFields } = seedDocument;

  try {
    await col.updateOne(
      { email: SUPER_ADMIN_EMAIL },
      {
        $set: setFields,
        $setOnInsert: { _id, email },
      },
      { upsert: true },
    );
  } catch (err: any) {
    if (err?.code === 121) {
      // Schema validation rejected the document — log details and rethrow
      // so the operator knows what field failed instead of silently falling
      // back to a shape that may be missing required fields.
      console.error('Platform admin seed failed schema validation:', err.errInfo ?? err.message);
      throw err;
    }
    throw err;
  }

  console.log(`Seeded platform super admin: ${SUPER_ADMIN_EMAIL}`);
}
