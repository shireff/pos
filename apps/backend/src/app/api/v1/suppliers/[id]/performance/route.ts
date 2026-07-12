import { NextRequest, NextResponse } from 'next/server';
import { GetSupplierPerformanceQuery } from '@packages/application-purchasing';
import { assertSuppliersPermission } from '../../../../../../lib/suppliers-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import {
  MongoSupplierLedgerEntryRepository,
  MongoSupplierPriceHistoryRepository,
} from '@packages/infrastructure-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.performance.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const dateFrom = url.searchParams.get('dateFrom') ?? undefined;
    const dateTo = url.searchParams.get('dateTo') ?? undefined;

    const ledgerRepo = new MongoSupplierLedgerEntryRepository();
    const priceHistoryRepo = new MongoSupplierPriceHistoryRepository();
    const query = new GetSupplierPerformanceQuery(ledgerRepo, priceHistoryRepo);
    const result = await query.execute({
      supplierId: id,
      companyId,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
