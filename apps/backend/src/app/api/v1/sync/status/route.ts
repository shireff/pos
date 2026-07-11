import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@packages/infrastructure-mongodb';
import {
  MongoOutboxRepository,
  MongoInboxRepository,
} from '@packages/infrastructure-sync';

function companyIdFrom(request: NextRequest): string {
  const url = new URL(request.url);
  return url.searchParams.get('companyId') ?? 'company-1';
}

/** GET /v1/sync/status — pending outbox count, last sync, transport type. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = await getMongoDb();
    const companyId = companyIdFrom(request);
    const outbox = new MongoOutboxRepository(db);
    const inbox = new MongoInboxRepository(db);

    const pending = await outbox.countPending(companyId);
    const lastSyncedAt = await outbox.lastSyncedAt(companyId);
    const pendingInbox = (await inbox.getPending()).length;

    // Server-side we always relay over the cloud WebSocket/Realtime transport.
    const transportType = process.env.SUPABASE_URL ? 'supabase_realtime' : 'websocket';

    return NextResponse.json({
      success: true,
      data: {
        companyId,
        pendingOutbox: pending,
        pendingInbox,
        lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
        transportType,
        offline: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
