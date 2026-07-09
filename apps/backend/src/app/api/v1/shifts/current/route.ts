import { NextRequest, NextResponse } from 'next/server';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../../lib/sales-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getSalesRepos } from '../../sales/sales.deps';
import { serializeShift } from '../../sales/serialize';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.view');

    const companyId = getCompanyId(request);
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') ?? 'branch-1';
    const cashierId = url.searchParams.get('cashierId') ?? getActorId(request);

    const { shiftRepo } = getSalesRepos();
    const session = await shiftRepo.findOpenForCashier(companyId, branchId, cashierId);

    if (!session) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: serializeShift(session) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
