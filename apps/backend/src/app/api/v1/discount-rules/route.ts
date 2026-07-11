import { NextRequest, NextResponse } from 'next/server';
import {
  CreateDiscountRuleCommand,
  UpdateDiscountRuleCommand,
  DeactivateDiscountRuleCommand,
} from '@packages/application-promotions';
import {
  MongoDiscountRepository,
} from '@packages/infrastructure-mongodb';
import { assertPromotionsPermission } from '../../../../lib/promotions-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { CreateDiscountRuleSchema, UpdateDiscountRuleSchema } from './discount-rules.schemas';

const repo = new MongoDiscountRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.discount.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const type = url.searchParams.get('type') ?? undefined;
    const isActive = url.searchParams.get('isActive') ? url.searchParams.get('isActive') === 'true' : undefined;

    const discounts = await repo.findByCompany(companyId, type, isActive);

    return NextResponse.json({ success: true, data: discounts });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.discount.create');

    const body: unknown = await request.json();
    const parsed = CreateDiscountRuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new CreateDiscountRuleCommand(repo);
    const discount = await command.execute({
      companyId: 'company-1',
      name: parsed.data.name,
      type: parsed.data.type,
      ruleJson: parsed.data.ruleJson,
      validFrom: parsed.data.validFrom ?? undefined,
      validUntil: parsed.data.validUntil ?? undefined,
      priority: parsed.data.priority,
      isExclusive: parsed.data.isExclusive,
    });

    return NextResponse.json({ success: true, data: discount }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.discount.edit');

    const body: unknown = await request.json();
    const parsed = UpdateDiscountRuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new UpdateDiscountRuleCommand(repo);
    const discount = await command.execute({
      id: parsed.data.id,
      companyId: 'company-1',
      name: parsed.data.name,
      ruleJson: parsed.data.ruleJson,
      priority: parsed.data.priority,
      isExclusive: parsed.data.isExclusive,
    });

    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST_DEACTIVATE(request: NextRequest, id: string): Promise<NextResponse> {
  try {
    await assertPromotionsPermission(request, 'promotions.discount.edit');

    const command = new DeactivateDiscountRuleCommand(repo);
    const discount = await command.execute({ id, companyId: 'company-1' });

    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
