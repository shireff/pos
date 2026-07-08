import { NextRequest, NextResponse } from 'next/server';
import { UpdateCategoryUseCase, DeleteCategoryUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../lib/errors';
import {
  MongoCategoryRepository,
  MongoProductRepository,
} from '../../../../../lib/mongo-catalog-repository';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.edit');

    const { id } = await context.params;
    const body = (await request.json()) as {
      companyId?: string;
      name?: { ar: string; en?: string };
      sortOrder?: number;
    };

    const repo = new MongoCategoryRepository();
    const useCase = new UpdateCategoryUseCase(repo);
    const { category } = await useCase.execute({
      companyId: body.companyId ?? 'company-1',
      categoryId: id,
      name: body.name,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        level: category.level,
        path: category.path,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.delete');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const categoryRepo = new MongoCategoryRepository();
    const productRepo = new MongoProductRepository();
    const useCase = new DeleteCategoryUseCase(categoryRepo, productRepo);
    const { archivedCount } = await useCase.execute({ companyId, categoryId: id });

    return NextResponse.json({ success: true, data: { archivedCount } }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
