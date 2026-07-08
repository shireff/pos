import { NextRequest, NextResponse } from 'next/server';
import { UpdateUnitUseCase } from '@packages/application-catalog';
import { UnitOfMeasure } from '@packages/domain-catalog';
import { assertCatalogPermission } from '../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../lib/errors';

const store: UnitOfMeasure[] = [];

class InMemoryUnitRepository {
  async findById(id: string, companyId: string): Promise<UnitOfMeasure | null> {
    return store.find((u) => u.id === id && u.productId === companyId) ?? null;
  }
  async findAll(companyId: string): Promise<UnitOfMeasure[]> {
    return store.filter((u) => u.productId === companyId);
  }
  async existsByAbbreviation(
    abbreviation: string,
    companyId: string,
    excludeId?: string,
  ): Promise<boolean> {
    return store.some(
      (u) => u.productId === companyId && u.unitName === abbreviation && u.id !== excludeId,
    );
  }
  async hasActiveProductReferences(_unitId: string, _companyId: string): Promise<boolean> {
    return false;
  }
  async save(unit: UnitOfMeasure): Promise<void> {
    const idx = store.findIndex((u) => u.id === unit.id);
    if (idx >= 0) store[idx] = unit;
    else store.push(unit);
  }
}

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
      abbreviation?: string;
      conversionFactorToBase?: number;
    };

    const repo = new InMemoryUnitRepository();
    const useCase = new UpdateUnitUseCase(repo);
    const { unit } = await useCase.execute({
      companyId: body.companyId ?? 'company-1',
      unitId: id,
      name: body.name,
      abbreviation: body.abbreviation,
      conversionFactorToBase: body.conversionFactorToBase,
    });

    return NextResponse.json({ success: true, data: unit });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
