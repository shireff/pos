import { NextRequest, NextResponse } from 'next/server';
import { AddVariantUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoProductRepository } from '../../../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.create');

    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch {
      /* no-op */
    }

    const payload = await request.json();
    const useCase = new AddVariantUseCase(new MongoProductRepository());
    const variant = await useCase.execute({
      companyId,
      productId: id,
      sku: payload.sku,
      barcode: payload.barcode,
    });

    return NextResponse.json(
      { success: true, data: { sku: variant.sku, id: variant.id } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
