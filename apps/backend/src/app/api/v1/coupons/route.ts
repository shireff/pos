import { NextRequest, NextResponse } from 'next/server';
import {
  CreateCouponCommand,
  ValidateCouponCommand,
} from '@packages/application-promotions';
import {
  MongoCouponRepository,
} from '@packages/infrastructure-mongodb';
import { assertPromotionsPermission, getActorId } from '../../../../lib/promotions-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { CreateCouponSchema, ValidateCouponSchema } from './coupons.schemas';

const repo = new MongoCouponRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.coupon.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const coupons = await repo.findByCompany(companyId);

    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.coupon.create');

    const body: unknown = await request.json();
    const parsed = CreateCouponSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new CreateCouponCommand(repo);
    const coupon = await command.execute({
      companyId: 'company-1',
      code: parsed.data.code.toUpperCase(),
      discountType: parsed.data.discountType,
      amount: parsed.data.amount,
      isMultiUse: parsed.data.isMultiUse ?? false,
      usageLimit: parsed.data.usageLimit,
      expiresAt: parsed.data.expiresAt ?? null,
      scopeType: parsed.data.scopeType,
      scopeIds: parsed.data.scopeIds,
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST_VALIDATE(request: NextRequest): Promise<NextResponse> {
  try {
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
