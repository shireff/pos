import { SupabaseStorageAdapter, SupabaseStorageConfig } from './supabase-storage.adapter';

// type alias is used instead of empty interface — no eslint disable needed
export type SupabaseStorageConfigEnv = SupabaseStorageConfig;

/**
 * Loads Supabase Storage configuration from environment variables.
 *
 * - SUPABASE_URL: the Supabase project URL, e.g. https://xxxx.supabase.co
 * - SUPABASE_KEY: the Supabase service role key or admin key for storage access
 * - SUPABASE_BUCKET: Storage bucket name (defaults to "backups")
 */
export function loadSupabaseStorageConfigFromEnv(): SupabaseStorageConfig | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
  const supabaseKey = process.env.SUPABASE_KEY?.trim() ?? '';
  const bucketName = process.env.SUPABASE_BUCKET?.trim() ?? 'backups';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseKey,
    bucketName,
  };
}

export function createSupabaseStorageAdapterFromEnv(): SupabaseStorageAdapter | null {
  const config = loadSupabaseStorageConfigFromEnv();
  if (!config) return null;
  return new SupabaseStorageAdapter(config);
}
