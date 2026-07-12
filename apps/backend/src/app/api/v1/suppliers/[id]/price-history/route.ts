import { NextRequest, NextResponse } from 'next/server';
import { GetSupplierPriceHistoryQuery } from '@packages/application-purchasing';
import { assertSuppliersPermission } from '../../../../../../lib/suppliers-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoSupplierPriceHistoryRepository } from '@packages/infrastructure-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.performance.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const productId = url.searchParams.get('productId') ?? undefined;
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0;

    const repo = new MongoSupplierPriceHistoryRepository();
    const query = new GetSupplierPriceHistoryQuery(repo);
    const result = await query.execute({
      supplierId: id,
      companyId,
      productId,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
