import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@packages/infrastructure-mongodb';
import { MongoConflictRepository } from '@packages/infrastructure-sync';
import { SyncConflictsQuerySchema } from '../schemas';

function companyIdFrom(request: NextRequest): string {
  const url = new URL(request.url);
  return url.searchParams.get('companyId') ?? 'company-1';
}

/** GET /v1/sync/conflicts — paginated unresolved conflicts. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = await getMongoDb();
    const companyId = companyIdFrom(request);
    const parsed = SyncConflictsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 },
      );
    }

    const repo = new MongoConflictRepository(db);
    const conflicts = await repo.findPendingPaginated(
      companyId,
      parsed.data.limit,
      parsed.data.offset,
    );

    return NextResponse.json({
      success: true,
       data: conflicts.map((c: { id: string; companyId: string; entityType: string; entityId: string; field: string; localValue: unknown; remoteValue: unknown; status: string; createdAt: string }) => ({
        id: c.id,
        companyId: c.companyId,
        entityType: c.entityType,
        entityId: c.entityId,
        field: c.field,
        localValue: c.localValue,
        remoteValue: c.remoteValue,
        status: c.status,
        createdAt: c.createdAt,
      })),
      pagination: { limit: parsed.data.limit, offset: parsed.data.offset },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
