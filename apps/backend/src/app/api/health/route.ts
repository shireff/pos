/**
 * GET /api/health
 *
 * Returns the application health status.
 * Conforms to API.md §3 — standard API envelope.
 *
 * Response:
 *   200 { success: true, data: { status, timestamp, version } }
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  return NextResponse.json(
    {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        requestId,
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
