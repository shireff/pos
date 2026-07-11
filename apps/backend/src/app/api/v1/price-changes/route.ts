import { NextRequest, NextResponse } from 'next/server';
import {
  RequestPriceChangeCommand,
  ApprovePriceChangeCommand,
  RejectPriceChangeCommand,
} from '@packages/application-tax';
import {
  MongoPriceChangeRepository,
} from '@packages/infrastructure-mongodb';
import { assertPricingPermission } from '../../../../lib/pricing-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import {
  RequestPriceChangeSchema,
  ApprovePriceChangeSchema,
  RejectPriceChangeSchema,
} from './price-changes.schemas';

const repo = new MongoPriceChangeRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPricingPermission(request, 'pricing.change');

    const body: unknown = await request.json();
    const parsed = RequestPriceChangeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new RequestPriceChangeCommand(repo);
    const priceChange = await command.execute({
      companyId: 'company-1',
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      oldPricePiasters: parsed.data.oldPricePiasters,
      newPricePiasters: parsed.data.newPricePiasters,
      requestedByUserId: 'system',
      notes: parsed.data.notes,
      autoApproveThresholdPiasters: parsed.data.autoApproveThresholdPiasters,
    });

    return NextResponse.json({ success: true, data: priceChange }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST_APPROVE(request: NextRequest, id: string): Promise<NextResponse> {
  try {
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

export async function POST_REJECT(request: NextRequest, id: string): Promise<NextResponse> {
  try {
    await assertPricingPermission(request, 'pricing.change.approve');

    const parsed = RejectPriceChangeSchema.safeParse({ id });
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new RejectPriceChangeCommand(repo);
    const priceChange = await command.execute({
      id: parsed.data.id,
      companyId: 'company-1',
    });

    return NextResponse.json({ success: true, data: priceChange });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
