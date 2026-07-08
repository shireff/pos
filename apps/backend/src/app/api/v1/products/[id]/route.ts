import { NextRequest, NextResponse } from 'next/server';
import { GetProductQueryUseCase, UpdateProductUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../lib/errors';
import {
  MongoCategoryRepository,
  MongoProductRepository,
} from '../../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../../lib/auth';

function serializeProduct(product: {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  description: string;
  baseUnitId: string | null;
  productType: string;
  isBundle: boolean;
  isSerialized: boolean;
  requiresBatchTracking: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: product.id,
    companyId: product.companyId,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    baseUnitId: product.baseUnitId,
    productType: product.productType,
    isBundle: product.isBundle,
    isSerialized: product.isSerialized,
    requiresBatchTracking: product.requiresBatchTracking,
    isDeleted: product.isDeleted,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function resolveCompanyId(request: NextRequest): string {
  try {
    return getAuthContext(request).companyId;
  } catch {
    return 'company-1';
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.view');

    const { id } = await context.params;
    const companyId = resolveCompanyId(request);

    const useCase = new GetProductQueryUseCase(new MongoProductRepository());
    const product = await useCase.execute({ companyId, productId: id });

    return NextResponse.json({ success: true, data: serializeProduct(product) }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.edit');

    const { id } = await context.params;
    const companyId = resolveCompanyId(request);
    const payload = await request.json();

    const productRepo = new MongoProductRepository();
    const categoryRepo = new MongoCategoryRepository();
    const useCase = new UpdateProductUseCase(productRepo, categoryRepo);

    const product = await useCase.execute({
      companyId,
      productId: id,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId ?? undefined,
    });

    return NextResponse.json({ success: true, data: serializeProduct(product) }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
