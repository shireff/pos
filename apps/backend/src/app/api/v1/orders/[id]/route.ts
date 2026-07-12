import { NextRequest, NextResponse } from 'next/server';
import { GetOrderQuery } from '@packages/application-sales';
import { assertSalesPermission, getCompanyId } from '../../../../../lib/sales-permissions';
import { handleApiError, NotFoundError } from '../../../../../lib/errors';
import { getSalesRepos } from '../../sales/sales.deps';
import { serializeOrder } from '../../sales/serialize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSalesPermission(request, 'sales.view');

    const companyId = getCompanyId(request);
    const { orderRepo } = getSalesRepos();
    const query = new GetOrderQuery(orderRepo);
    const order = await query.execute({ companyId, orderId: id });

    if (!order) throw new NotFoundError('Order', id);

    return NextResponse.json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
