/**
 * Temporary: verify the exact login flow against Atlas.
 * Run: npx dotenv -e .env -- npx ts-node --esm packages/infrastructure/mongodb/src/cli/verify-login.ts
 * Delete after use.
 */
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const EMAIL = 'superadmin@pos.local';
const PASSWORD = 'SuperAdmin@2026';

function verifyPassword(input: string, stored: string): boolean {
    try {
        const parts = stored.split('$');
        if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
        const [, saltHex, keyHex] = parts;
        const derived = crypto.scryptSync(input, Buffer.from(saltHex, 'hex'), 64);
        return crypto.timingSafeEqual(derived, Buffer.from(keyHex, 'hex'));
    } catch {
        return false;
    }
}

async function main() {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME ?? 'pos';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    // Exact query the route uses
    const doc = await db.collection('platform_admins').findOne({ email: EMAIL, is_active: true });

    if (!doc) {
        console.log('❌ findOne({ email, is_active: true }) returned null');
        console.log('   → Either document missing OR is_active is not true (boolean)');

        // Check without is_active filter
        const anyDoc = await db.collection('platform_admins').findOne({ email: EMAIL });
        if (anyDoc) {
            console.log('   ✓ Document EXISTS but is_active =', anyDoc.is_active, '(type:', typeof anyDoc.is_active, ')');
            console.log('   Fields:', Object.keys(anyDoc).join(', '));
        } else {
            console.log('   ❌ No document at all for', EMAIL);
        }
    } else {
        console.log('✅ Document found with is_active filter');
        console.log('   is_active   :', doc.is_active, '(type:', typeof doc.is_active, ')');
        console.log('   mfa_secret  :', doc.mfa_secret);
        console.log('   is_mfa_enrolled:', doc.is_mfa_enrolled);
        console.log('   hash prefix :', String(doc.password_hash).substring(0, 25) + '...');

        const ok = verifyPassword(PASSWORD, String(doc.password_hash));
        console.log('   password OK :', ok ? '✅ MATCH' : '❌ MISMATCH');

        if (!ok) {
            console.log('\n→ Resetting hash now...');
            const salt = crypto.randomBytes(16).toString('hex');
            const derived = crypto.scryptSync(PASSWORD, Buffer.from(salt, 'hex'), 64);
            const newHash = `scrypt$${salt}$${derived.toString('hex')}`;
            await db.collection('platform_admins').updateOne(
                { email: EMAIL },
                { $set: { password_hash: newHash, is_active: true, mfa_secret: 'JBSWY3DPEHPK3PXP', is_mfa_enrolled: true, updated_at: new Date() } },
            );
            console.log('✅ Hash reset done.');
        }
    }

    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
