import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
for (const l of env.split('\n')) {
  const t = l.trim(); if (!t || t[0] === '#') continue;
  const e = t.indexOf('='); if (e < 0) continue;
  const k = t.slice(0, e).trim(), v = t.slice(e + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB_NAME || 'pos');

for (const name of ['units', 'categories', 'subscriptions']) {
  const r = await db.listCollections({ name }).toArray();
  if (!r[0]) { console.log(name + ': NOT EXISTS'); continue; }
  const schema = r[0]?.options?.validator?.['$jsonSchema'];
  if (!schema) { console.log(name + ': no validator'); continue; }
  if (name === 'units') {
    console.log('units.conversion_factor_to_base:', JSON.stringify(schema.properties?.conversion_factor_to_base));
    console.log('units required:', JSON.stringify(schema.required));
    console.log('units additionalProperties:', schema.additionalProperties);
  }
  if (name === 'subscriptions') {
    console.log('sub.status enum:', JSON.stringify(schema.properties?.status?.enum));
    console.log('sub required:', JSON.stringify(schema.required));
  }
  if (name === 'categories') {
    console.log('cat.name schema:', JSON.stringify(schema.properties?.name));
    console.log('cat required:', JSON.stringify(schema.required));
  }
}

await client.close();
