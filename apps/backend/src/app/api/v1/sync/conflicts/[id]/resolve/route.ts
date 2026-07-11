import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@packages/infrastructure-mongodb';
import {
  MongoConflictRepository,
  MongoReplicaStore,
} from '@packages/infrastructure-sync';
import { ConflictResolutionService } from '@packages/application-sync';
import { ResolveConflictSchema } from '../../../schemas';

function companyIdFrom(request: NextRequest): string {
  const url = new URL(request.url);
  return url.searchParams.get('companyId') ?? 'company-1';
}

/**
 * POST /v1/sync/conflicts/:id/resolve
 * Body: { winner: 'local' | 'remote' | 'merge', resolvedValue?: unknown }
 * Resolves a conflict, records the resolution in the audit trail, and writes
 * the winning value back to the owning entity document.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const db = await getMongoDb();
    const companyId = companyIdFrom(request);
    const body: unknown = await request.json();
    const parsed = ResolveConflictSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid body: winner must be local|remote|merge' },
        { status: 400 },
      );
    }

    const conflicts = new MongoConflictRepository(db);
    const replica = new MongoReplicaStore(db);
    const service = new ConflictResolutionService({ conflicts, replica });

    const actorId = request.headers.get('x-actor-id');
    const resolved = await service.resolve(
      params.id,
      parsed.data.winner,
      actorId,
      parsed.data.resolvedValue,
    );

    return NextResponse.json({
      success: true,
      data: {
        id: resolved.id,
        status: resolved.status,
        field: resolved.field,
        auditTrail: resolved.auditTrail,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.startsWith('Conflict not found') ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
