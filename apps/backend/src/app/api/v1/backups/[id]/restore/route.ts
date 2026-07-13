import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMongoDb } from '../../../../../../lib/cloud-db';
import { getAuthContext } from '../../../../../../lib/auth';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { createBackupPorts } from '../../../../../../lib/backup/backup-service';
import { assertBackupCommandAllowed } from '../../../../../../lib/backup/backup-write-lock';
import { RestoreBackupHandler } from '@packages/application-backup';
import { RestoreBackupBodySchema } from '../../backups.schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseOrThrow<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  try {
    return schema.parse(body) as z.infer<T>;
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new ValidationError(e.issues.map((x) => x.message).join('; '));
    }
    throw e;
  }
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.restore');

    const { id } = await params;
    const ctx = getAuthContext(request);
    const db = await getMongoDb();
    // Data-safety carve-out: restore remains available even when locked.
    await assertBackupCommandAllowed(db, request, 'RestoreBackupCommand');

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = parseOrThrow(RestoreBackupBodySchema, body);

    const handler = new RestoreBackupHandler(createBackupPorts(db));
    const result = await handler.execute({
      companyId: ctx.companyId,
      backupId: id,
      confirmText: parsed.confirmText,
    });

    return NextResponse.json(
      { success: true, data: { ...result, requiresRestart: true } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
