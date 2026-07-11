import { NextRequest, NextResponse } from 'next/server';
import { GetCreditHistoryQuery } from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../../../lib/customers-permissions';
import { handleApiError } from '../../../../../../../lib/errors';
import { MongoCreditLedgerEntryRepository } from '@packages/infrastructure-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.credit.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    const repo = new MongoCreditLedgerEntryRepository();
    const query = new GetCreditHistoryQuery(repo);
    const result = await query.execute({
      companyId,
      customerId: params.id,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result.entries, total: result.total });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
