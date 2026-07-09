import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MongoConnection } from '@packages/infrastructure-mongodb/src/mongo-connection';
import type { Db } from 'mongodb';

const DEFAULT_MONGO_URI = 'mongodb://localhost:27017';
const DEFAULT_MONGO_DB_NAME = 'smart_retail_os';

export function getMongoUri(): string {
  return process.env.MONGODB_URI?.trim() ?? DEFAULT_MONGO_URI;
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() ?? DEFAULT_MONGO_DB_NAME;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_KEY?.trim());
}

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variable.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Cache the connection promise across hot-reloads (Next.js HMR can discard
// module-level singletons). Storing on globalThis keeps a single warm
// connection for the lifetime of the server process.
const globalForMongo = globalThis as unknown as {
  __mongoConnectionPromise?: Promise<MongoConnection> | undefined;
};

export async function initMongoConnection(): Promise<MongoConnection> {
  if (!globalForMongo.__mongoConnectionPromise) {
    const mongoConnection = MongoConnection.getInstance(getMongoUri(), getMongoDbName());
    globalForMongo.__mongoConnectionPromise = mongoConnection
      .connect()
      .then(() => mongoConnection)
      .catch((error) => {
        // Don't cache a failed connection — allow the next call to retry.
        globalForMongo.__mongoConnectionPromise = undefined;
        throw error;
      });
  }
  return globalForMongo.__mongoConnectionPromise;
}

export async function getMongoDb(): Promise<Db> {
  const connection = await initMongoConnection();
  return connection.db();
}
