import { NextRequest, NextResponse } from 'next/server';
import { GetApplicableTaxesQuery } from '@packages/application-tax';
import { MongoTaxRuleRepository } from '@packages/infrastructure-mongodb';
import { assertTaxPermission } from '../../../../../lib/tax-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { GetApplicableTaxesSchema } from '../tax-rules.schemas';

const repo = new MongoTaxRuleRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertTaxPermission(request, 'tax.rules.view');

    const body: unknown = await request.json();
    const parsed = GetApplicableTaxesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const query = new GetApplicableTaxesQuery(repo);
    const result = await query.execute({
      companyId: 'company-1',
      productVariantIds: parsed.data.productVariantIds,
      categoryIds: parsed.data.categoryIds.map((c: string | null | undefined) => c ?? ''),
      subtotalPiasters: parsed.data.subtotalPiasters,
      mode: parsed.data.mode,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
