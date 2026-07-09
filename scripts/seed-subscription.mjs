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

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB_NAME || 'pos');

const existing = await db.collection('subscriptions').findOne({ _id: 'demo-sub-001' });
if (existing) {
  console.log('✓ Subscription already exists:', existing.status);
} else {
  const now = new Date();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  // plan_id intentionally omitted — schema bsonType is 'string' (not nullable)
  await db.collection('subscriptions').insertOne({
    _id: 'demo-sub-001',
    company_id: 'demo-company-001',
    status: 'trialing',
    trial_started_at: now,
    trial_ends_at: trialEnd,
    created_at: now,
    updated_at: now,
  });
  console.log('✅ Subscription created (trialing, 14 days)');
}

await client.close();
