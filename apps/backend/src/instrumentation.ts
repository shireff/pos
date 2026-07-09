/**
 * Next.js instrumentation hook.
 *
 * Warms the MongoDB connection when the server boots so the first
 * user-facing request (e.g. admin login) doesn't pay the cost of the
 * initial Atlas connection — which can take 10–30s on an idle free tier.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { initMongoConnection } = await import('./lib/cloud-db');
    await initMongoConnection();
  } catch (error) {
    // Non-fatal: routes will lazily connect on demand if this fails.
    console.error('[instrumentation] failed to pre-warm MongoDB connection:', error);
  }
}
