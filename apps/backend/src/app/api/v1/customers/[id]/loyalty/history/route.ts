import { NextRequest, NextResponse } from 'next/server';
import { GetLoyaltyHistoryQuery } from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../../../lib/customers-permissions';
import { handleApiError } from '../../../../../../../lib/errors';
import { MongoLoyaltyEventRepository } from '@packages/infrastructure-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertCustomersPermission(request, 'customers.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    const repo = new MongoLoyaltyEventRepository();
    const query = new GetLoyaltyHistoryQuery(repo);
    const result = await query.execute({
      companyId,
      customerId: id,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result.events, total: result.total });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
