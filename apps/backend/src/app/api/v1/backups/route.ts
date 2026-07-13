import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMongoDb } from '../../../../lib/cloud-db';
import { getAuthContext } from '../../../../lib/auth';
import { assertCatalogPermission } from '../../../../lib/catalog-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { createBackupPorts } from '../../../../lib/backup/backup-service';
import { assertBackupCommandAllowed } from '../../../../lib/backup/backup-write-lock';
import { ListBackupsHandler, CreateBackupHandler } from '@packages/application-backup';
import { CreateBackupSchema } from './backups.schemas';

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.view');

    const ctx = getAuthContext(request);
    const db = await getMongoDb();
    const handler = new ListBackupsHandler(createBackupPorts(db));
    const result = await handler.execute({ companyId: ctx.companyId });

    return NextResponse.json({ success: true, data: result.backups }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.create');

    const ctx = getAuthContext(request);
    const db = await getMongoDb();
    // Data-safety carve-out: backup remains available even when locked.
    await assertBackupCommandAllowed(db, request, 'CreateBackupCommand');

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = parseOrThrow(CreateBackupSchema, body);

    const handler = new CreateBackupHandler(createBackupPorts(db));
    const result = await handler.execute({
      companyId: ctx.companyId,
      type: parsed.type,
      triggeredBy: parsed.triggeredBy,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
