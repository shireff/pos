import { NextRequest, NextResponse } from 'next/server';
import { ValidateCouponCommand } from '@packages/application-promotions';
import { MongoCouponRepository } from '@packages/infrastructure-mongodb';
import { assertPromotionsPermission } from '../../../../../lib/promotions-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { ValidateCouponSchema } from '../coupons.schemas';

const repo = new MongoCouponRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.coupon.validate');

    const body: unknown = await request.json();
    const parsed = ValidateCouponSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new ValidateCouponCommand(repo);
    const result = await command.execute({
      code: parsed.data.code.toUpperCase(),
      companyId: 'company-1',
      cartTotalPiasters: parsed.data.cartTotalPiasters,
      customerId: parsed.data.customerId,
      lineItems: parsed.data.lineItems?.map((l) => ({
        productId: l.productId,
        categoryId: l.categoryId ?? null,
        productVariantId: l.productVariantId,
      })),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
