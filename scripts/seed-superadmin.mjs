/**
 * Seed Script: Create Platform SuperAdmin
 *
 * Creates the superadmin@pos.local account in MongoDB if it doesn't exist.
 * Uses the same scrypt hashing format as the backend login route.
 *
 * Usage:
 *   node scripts/seed-superadmin.mjs
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env manually (no dotenv dependency needed) ─────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env file — make sure it exists at the project root.');
  process.exit(1);
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'pos';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

const SUPERADMIN = {
  email: 'superadmin@pos.local',
  password: 'SuperAdmin@2026',
  // TOTP secret — already saved in superAdminLogin.txt
  // Scan the QR code printed below with Google Authenticator
  mfaSecret: 'JBSWY3DPEHPK3PXP',
  role: 'super_admin',
  name: 'Super Admin',
};

// ─── Password Hashing (matches backend verifyPassword) ────────────────────────

/**
 * Produces: scrypt$<salt_hex>$<derived_key_hex>
 * Uses canonical encoding: salt decoded from hex (matches the first candidate
 * in verifyPassword's loop).
 */
function hashPassword(password) {
  const saltHex = crypto.randomBytes(16).toString('hex'); // 32-char hex string
  const saltBuffer = Buffer.from(saltHex, 'hex');          // canonical: 16 bytes
  const derived = crypto.scryptSync(password, saltBuffer, 64);
  return `scrypt$${saltHex}$${derived.toString('hex')}`;
}

// ─── TOTP QR URI ──────────────────────────────────────────────────────────────

function totpUri(email, secret) {
  const issuer = encodeURIComponent('POS Platform');
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB…');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('platform_admins');

    // Check if already exists
    const existing = await collection.findOne({ email: SUPERADMIN.email });

    if (existing) {
      console.log(`\n✓ SuperAdmin already exists: ${SUPERADMIN.email}`);
      console.log('  To reset the password, delete the document and re-run this script.');
      return;
    }

    // Create the document
    const now = new Date();
    const adminDoc = {
      _id: crypto.randomUUID(),
      email: SUPERADMIN.email,
      name: SUPERADMIN.name,
      role: SUPERADMIN.role,
      password_hash: hashPassword(SUPERADMIN.password),
      mfa_secret: SUPERADMIN.mfaSecret,
      is_active: true,
      failed_login_attempts: 0,
      created_at: now,
      updated_at: now,
    };

    await collection.insertOne(adminDoc);

    console.log('\n✅ SuperAdmin created successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log(`  Email    : ${SUPERADMIN.email}`);
    console.log(`  Password : ${SUPERADMIN.password}`);
    console.log(`  MFA      : ${SUPERADMIN.mfaSecret}`);
    console.log('─────────────────────────────────────────');
    console.log('\n📱 Add to Google Authenticator by scanning this URI:');
    console.log('\n  ' + totpUri(SUPERADMIN.email, SUPERADMIN.mfaSecret));
    console.log('\n  (Or manually enter the secret: JBSWY3DPEHPK3PXP)');
    console.log('\n⚠️  Change the password after first login in production!\n');

  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
