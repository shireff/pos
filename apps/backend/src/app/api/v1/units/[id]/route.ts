import { NextRequest, NextResponse } from 'next/server';
import { UpdateUnitUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../lib/catalog-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { MongoUnitRepository } from '../../../../../lib/mongo-catalog-repository';
import { z } from 'zod';

const UpdateUnitSchema = z
  .object({
    companyId: z.string().min(1).optional(),
    name: z.object({ ar: z.string().min(1), en: z.string().optional() }).optional(),
    abbreviation: z.string().min(1).max(10).optional(),
    conversionFactorToBase: z.number().positive().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.abbreviation !== undefined ||
      data.conversionFactorToBase !== undefined,
    { message: 'At least one of name, abbreviation, or conversionFactorToBase is required' },
  );

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.edit');

    const { id } = await context.params;
    const body: unknown = await request.json();

    const parsed = UpdateUnitSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const repo = new MongoUnitRepository();
    const useCase = new UpdateUnitUseCase(repo);
    const { unit } = await useCase.execute({
      companyId: parsed.data.companyId ?? 'company-1',
      unitId: id,
      name: parsed.data.name,
      abbreviation: parsed.data.abbreviation,
      conversionFactorToBase: parsed.data.conversionFactorToBase,
    });

    return NextResponse.json({ success: true, data: unit });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
