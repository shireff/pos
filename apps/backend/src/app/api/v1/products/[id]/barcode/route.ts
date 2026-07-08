import { NextRequest, NextResponse } from 'next/server';
import { GenerateBarcodeUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoProductRepository } from '../../../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.barcode.generate');

    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch {
      /* no-op */
    }

    const useCase = new GenerateBarcodeUseCase(new MongoProductRepository());
    const result = await useCase.execute({ companyId, productId: id });

    return NextResponse.json({ success: true, data: { barcode: result.barcode } }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
