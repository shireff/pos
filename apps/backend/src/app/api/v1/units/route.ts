import { NextRequest, NextResponse } from 'next/server';
import { CreateUnitUseCase, ListUnitsUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../lib/errors';
import { MongoUnitRepository } from '../../../../lib/mongo-catalog-repository';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoUnitRepository();
    const useCase = new ListUnitsUseCase(repo);
    const result = await useCase.execute({ companyId });

    return NextResponse.json({ success: true, data: result.units });
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
      abbreviation?: string;
      isBaseUnit?: boolean;
      conversionFactorToBase?: number;
    };

    if (!body.name?.ar || !body.abbreviation || body.conversionFactorToBase === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'name.ar, abbreviation, and conversionFactorToBase are required',
          },
        },
        { status: 400 },
      );
    }

    const repo = new MongoUnitRepository();
    const useCase = new CreateUnitUseCase(repo);
    const { unit } = await useCase.execute({
      companyId: body.companyId ?? 'company-1',
      name: body.name,
      abbreviation: body.abbreviation,
      isBaseUnit: body.isBaseUnit ?? false,
      conversionFactorToBase: body.conversionFactorToBase,
    });

    return NextResponse.json({ success: true, data: unit }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
