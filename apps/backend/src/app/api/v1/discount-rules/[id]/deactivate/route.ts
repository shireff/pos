import { NextRequest, NextResponse } from 'next/server';
import { DeactivateDiscountRuleCommand } from '@packages/application-promotions';
import { MongoDiscountRepository } from '@packages/infrastructure-mongodb';
import { assertPromotionsPermission } from '../../../../../../lib/promotions-permissions';
import { handleApiError } from '../../../../../../lib/errors';

const repo = new MongoDiscountRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertPromotionsPermission(request, 'promotions.discount.edit');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const command = new DeactivateDiscountRuleCommand(repo);
    const discount = await command.execute({ id, companyId });

    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
