import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${message}\n`);
}

async function runSeed(modulePath: string, dbUrl: string, dbName: string) {
  const client = new MongoClient(dbUrl, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db(dbName);
  // dynamic import via createRequire would be used when compiled; ts-node handles imports
  const mod = await import(modulePath);
  if (typeof mod.seedSystemRoles === 'function') {
    await mod.seedSystemRoles(db);
  } else if (typeof mod.seedSubscriptionPlans === 'function') {
    await mod.seedSubscriptionPlans(db);
  } else if (typeof mod.seedPermissions === 'function') {
    await mod.seedPermissions(db);
  } else {
    // generic fallback: if module exports a function named `seed`
    if (typeof mod.seed === 'function') await mod.seed(db);
    else logError(`No known seed function exported from ${modulePath}`);
  }
  await client.close();
}

async function main() {
  const mongoUrl =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    'mongodb://localhost:27017/smart-retail-dev';
  const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'smart-retail-dev';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const seedsDir = path.resolve(__dirname, '../seeds');

  const files = await fs.promises.readdir(seedsDir);
  const seedFiles = files.filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of seedFiles) {
    const modulePath = path.join(seedsDir, file);
    log(`Running seed ${file}`);
    await runSeed(pathToFileURL(modulePath).href, mongoUrl, dbName);
  }
  log('All seeds completed');
}

main().catch((error: unknown) => {
  logError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
