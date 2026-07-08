import { NextRequest, NextResponse } from 'next/server';
import { ReorderCategoryUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoCategoryRepository } from '../../../../../../lib/mongo-catalog-repository';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.edit');

    const { id } = await context.params;
    const body = (await request.json()) as {
      companyId?: string;
      newParentId: string | null;
      sortOrder?: number;
    };

    if (body.newParentId === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'newParentId is required (use null for root)',
          },
        },
        { status: 400 },
      );
    }

    const repo = new MongoCategoryRepository();
    const useCase = new ReorderCategoryUseCase(repo);
    const { category, updatedCount } = await useCase.execute({
      companyId: body.companyId ?? 'company-1',
      categoryId: id,
      newParentId: body.newParentId,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        parentId: category.parentId,
        level: category.level,
        path: category.path,
        sortOrder: category.sortOrder,
        updatedCount,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
