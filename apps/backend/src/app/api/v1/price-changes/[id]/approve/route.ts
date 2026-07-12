import { NextRequest, NextResponse } from 'next/server';
import { ApprovePriceChangeCommand } from '@packages/application-tax';
import { MongoPriceChangeRepository } from '@packages/infrastructure-mongodb';
import { assertPricingPermission } from '../../../../../../lib/pricing-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { ApprovePriceChangeSchema } from '../../price-changes.schemas';

const repo = new MongoPriceChangeRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertPricingPermission(request, 'pricing.change.approve');

    const parsed = ApprovePriceChangeSchema.safeParse({ id });
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new ApprovePriceChangeCommand(repo);
    const priceChange = await command.execute({
      id: parsed.data.id,
      companyId: 'company-1',
      approvedByUserId: 'system',
    });

    return NextResponse.json({ success: true, data: priceChange });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
