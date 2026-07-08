import { NextRequest, NextResponse } from 'next/server';
import { CreateProductUseCase, ListProductsQueryUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../lib/errors';
import {
  MongoCategoryRepository,
  MongoProductRepository,
} from '../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../lib/auth';

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.view');

    const url = new URL(request.url);
    let companyId = url.searchParams.get('companyId');

    // Prefer authenticated company from JWT if available
    try {
      const ctx = getAuthContext(request);
      companyId = companyId ?? ctx.companyId;
    } catch {
      /* no-op: unauthenticated callers supply companyId as query param */
    }

    companyId = companyId ?? 'company-1';
    const status =
      (url.searchParams.get('status') as 'active' | 'archived' | 'all' | null) ?? 'active';
    const search = url.searchParams.get('search') ?? undefined;
    const sortBy =
      (url.searchParams.get('sortBy') as 'name' | 'price' | 'createdAt' | null) ?? 'name';
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const offset = Number(url.searchParams.get('offset') ?? '0');

    const useCase = new ListProductsQueryUseCase(new MongoProductRepository());
    const result = await useCase.execute({ companyId, status, search, sortBy, limit, offset });

    return NextResponse.json(
      {
        success: true,
        data: {
          items: result.items.map(serializeProduct),
          total: result.total,
          limit,
          offset,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.create');

    let companyId = 'company-1';
    try {
      const ctx = getAuthContext(request);
      companyId = ctx.companyId;
    } catch {
      /* no-op */
    }

    const payload = await request.json();

    const productRepo = new MongoProductRepository();
    const categoryRepo = new MongoCategoryRepository();
    const useCase = new CreateProductUseCase(productRepo, categoryRepo);

    const product = await useCase.execute({
      companyId: payload.companyId ?? companyId,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId ?? null,
    });

    return NextResponse.json({ success: true, data: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
