import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
for (const l of env.split('\n')) { const t=l.trim(); if(!t||t[0]==='#') continue; const e=t.indexOf('='); if(e<0) continue; const k=t.slice(0,e).trim(),v=t.slice(e+1).trim(); if(!process.env[k]) process.env[k]=v; }
const c = new MongoClient(process.env.MONGODB_URI);
await c.connect();
const db = c.db(process.env.MONGODB_DB_NAME || 'pos');
const subs = await db.collection('subscriptions').find({}).toArray();
console.log('Total subscriptions:', subs.length);
subs.forEach(s => console.log(JSON.stringify({ _id: s._id, company_id: s.company_id, status: s.status })));
// Also check what collections exist
const cols = await db.listCollections().toArray();
console.log('\nCollections:', cols.map(c => c.name).join(', '));
await c.close();
