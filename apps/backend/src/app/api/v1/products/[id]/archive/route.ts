import { NextRequest, NextResponse } from 'next/server';
import { ArchiveProductUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoProductRepository } from '../../../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../../../lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.delete');

    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch {
      /* no-op */
    }

    const useCase = new ArchiveProductUseCase(new MongoProductRepository());
    const product = await useCase.execute({ companyId, productId: id });

    return NextResponse.json(
      { success: true, data: { isDeleted: product.isDeleted } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
