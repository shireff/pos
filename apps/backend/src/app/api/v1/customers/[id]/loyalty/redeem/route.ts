import { NextRequest, NextResponse } from 'next/server';
import { RedeemLoyaltyPointsCommand } from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../../../lib/customers-permissions';
import { handleApiError, ValidationError } from '../../../../../../../lib/errors';
import {
  MongoLoyaltyAccountRepository,
  MongoLoyaltyEventRepository,
} from '@packages/infrastructure-mongodb';
import { RedeemLoyaltySchema } from '../../../customers.schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.loyalty.redeem');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = RedeemLoyaltySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const accountRepo = new MongoLoyaltyAccountRepository();
    const eventRepo = new MongoLoyaltyEventRepository();
    const command = new RedeemLoyaltyPointsCommand(accountRepo, eventRepo);
    const result = await command.execute({
      companyId,
      customerId: params.id,
      points: parsed.data.points,
      orderId: parsed.data.orderId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
