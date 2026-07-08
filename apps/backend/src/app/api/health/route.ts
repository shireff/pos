/**
 * GET /api/health
 *
 * Returns the application health status including real database connectivity check.
 * Conforms to API.md §3 — standard API envelope.
 *
 * Response:
 *   200 { success: true, data: { status, timestamp, version, dbConnected, encryptionActive } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, isMongoConfigured } from '../../../lib/cloud-db';

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  let dbConnected = false;
  let encryptionActive = false;

  try {
    const db = await getMongoDb();
    // Simple ping to verify connection is alive
    await db.command({ ping: 1 });
    dbConnected = true;
    // Encryption is active when MONGODB_URI is set and contains TLS/encryption config
    encryptionActive = isMongoConfigured() && Boolean(process.env.MONGODB_CLIENT_ENCRYPTION_KEY);
  } catch {
    dbConnected = false;
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        status: dbConnected ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        dbConnected,
        encryptionActive,
        requestId,
        appVersion: APP_VERSION,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Request-Id': requestId,
      },
    },
  );
}
