import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../../lib/cloud-db';
import { getAuthContext } from '../../../../../../lib/auth';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { createBackupPorts } from '../../../../../../lib/backup/backup-service';
import { VerifyBackupIntegrityHandler } from '@packages/application-backup';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'backup.view');

    const { id } = await params;
    const ctx = getAuthContext(request);
    const db = await getMongoDb();

    const handler = new VerifyBackupIntegrityHandler(createBackupPorts(db));
    const result = await handler.execute({ companyId: ctx.companyId, backupId: id });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
