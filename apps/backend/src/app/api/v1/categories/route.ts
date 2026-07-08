import { NextRequest, NextResponse } from 'next/server';
import {
  CreateCategoryUseCase,
  GetCategoryTreeUseCase,
  type CategoryNode,
} from '@packages/application-catalog';
// import { Category } from '@packages/domain-catalog';
import { assertCatalogPermission } from '../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../lib/errors';
import { MongoCategoryRepository } from '../../../../lib/mongo-catalog-repository';

function serializeNode(node: CategoryNode): object {
  return {
    id: node.id,
    companyId: node.companyId,
    name: node.name,
    parentId: node.parentId,
    sortOrder: node.sortOrder,
    level: node.level,
    path: node.path,
    isDeleted: node.isDeleted,
    children: node.children.map(serializeNode),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const flat = url.searchParams.get('flat') === 'true';

    const repo = new MongoCategoryRepository();
    const useCase = new GetCategoryTreeUseCase(repo);
    const result = await useCase.execute({ companyId });

    return NextResponse.json({
      success: true,
      data: flat ? result.flat.map(serializeNode) : result.tree.map(serializeNode),
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.create');

    const body = (await request.json()) as {
      companyId?: string;
      name?: { ar: string; en?: string };
      parentId?: string | null;
      sortOrder?: number;
    };

    if (!body.name?.ar) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name.ar is required' } },
        { status: 400 },
      );
    }

    const repo = new MongoCategoryRepository();
    const useCase = new CreateCategoryUseCase(repo);
    const { category } = await useCase.execute({
      companyId: body.companyId ?? 'company-1',
      name: body.name,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: category.id,
          companyId: category.companyId,
          name: category.name,
          parentId: category.parentId,
          sortOrder: category.sortOrder,
          level: category.level,
          path: category.path,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
