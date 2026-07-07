/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

const SUPER_ADMIN_EMAIL = 'superadmin@pos.local';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2026';
const SUPER_ADMIN_MFA_SECRET = 'JBSWY3DPEHPK3PXP';

function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function seed(db: any) {
  const col = db.collection('platform_admins');
  const now = new Date();

  const seedDocumentNew: Record<string, unknown> = {
    _id: crypto.randomUUID(),
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    password_hash: createPasswordHash(SUPER_ADMIN_PASSWORD),
    mfa_secret: SUPER_ADMIN_MFA_SECRET,
    is_mfa_enrolled: true,
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: now,
    updated_at: now,
  };

  const seedDocumentLegacy: Record<string, unknown> = {
    _id: crypto.randomUUID(),
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    password_hash: createPasswordHash(SUPER_ADMIN_PASSWORD),
    mfa_secret: SUPER_ADMIN_MFA_SECRET,
    is_active: true,
    failed_login_attempts: 0,
    locked_until: new Date(0),
    created_at: now,
    updated_at: now,
  };

  try {
    await col.updateOne(
      { email: SUPER_ADMIN_EMAIL },
      { $setOnInsert: seedDocumentNew },
      { upsert: true },
    );
  } catch (err: any) {
    if (err?.code === 121 && err.errInfo?.details?.schemaRulesNotSatisfied) {
      console.warn(
        'Platform admin seed failed validation with new schema shape; retrying legacy shape.',
      );
      await col.updateOne(
        { email: SUPER_ADMIN_EMAIL },
        { $setOnInsert: seedDocumentLegacy },
        { upsert: true },
      );
    } else {
      throw err;
    }
  }

  console.log(`Seeded platform super admin: ${SUPER_ADMIN_EMAIL}`);
}
