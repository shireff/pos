import { NextRequest, NextResponse } from 'next/server';
import { GetSupplierLedgerQuery } from '@packages/application-purchasing';
import { assertSuppliersPermission } from '../../../../../../lib/suppliers-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoSupplierLedgerEntryRepository } from '@packages/infrastructure-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await assertSuppliersPermission(request, 'suppliers.ledger.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0;

    const ledgerRepo = new MongoSupplierLedgerEntryRepository();
    const query = new GetSupplierLedgerQuery(ledgerRepo);
    const result = await query.execute({
      supplierId: params.id,
      companyId,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
