/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { MongoClient } from 'mongodb';

async function main() {
  const cmd = process.argv[2] || 'up';
  const mongoUrl =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    'mongodb://localhost:27017/smart-retail-dev';
  const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'smart-retail-dev';

  const client = new MongoClient(mongoUrl, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db(dbName);

  // Dynamic import of migration-runner to be compatible with ts-node ESM/CommonJS setups
  let MigrationRunner: any;
  try {
    const runnerPath = new URL('../migration-runner.ts', import.meta.url);
    const runnerModule = await import(runnerPath.href);
    MigrationRunner = runnerModule.MigrationRunner ?? runnerModule.default ?? runnerModule;
  } catch (err) {
    console.error('Failed to import migration-runner.ts:', err);
    const runnerPath = new URL('../migration-runner.js', import.meta.url);
    const runnerModule = await import(runnerPath.href);
    MigrationRunner = runnerModule.MigrationRunner ?? runnerModule.default ?? runnerModule;
  }

  const runner = new MigrationRunner(db, undefined);

  try {
    if (cmd === 'up') {
      console.log('Running migrations (up) against', mongoUrl);
      await runner.up();
      console.log('Migrations completed');
    } else if (cmd === 'down') {
      console.log('Rolling back last migration (down) against', mongoUrl);
      await runner.down();
      console.log('Rollback completed');
    } else {
      console.error('Unknown command:', cmd);
      process.exit(2);
    }
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
