import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../lib/cloud-db';
import { getAuthContext } from '../../../../../lib/auth';
import { assertCatalogPermission } from '../../../../../lib/catalog-permissions';
import { handleApiError, NotFoundError } from '../../../../../lib/errors';
import { createBackupPorts } from '../../../../../lib/backup/backup-service';
import { ListBackupsHandler, DeleteBackupHandler } from '@packages/application-backup';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.view');

    const { id } = await params;
    const ctx = getAuthContext(request);
    const db = await getMongoDb();

    const listHandler = new ListBackupsHandler(createBackupPorts(db));
    const { backups } = await listHandler.execute({ companyId: ctx.companyId });
    const backup = backups.find((b) => b.id === id);
    if (!backup) {
      throw new NotFoundError('Backup', id);
    }

    return NextResponse.json({ success: true, data: backup }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.create');

    const { id } = await params;
    const ctx = getAuthContext(request);
    const db = await getMongoDb();

    const handler = new DeleteBackupHandler(createBackupPorts(db));
    const result = await handler.execute({ companyId: ctx.companyId, backupId: id });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
