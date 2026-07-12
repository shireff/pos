import { NextRequest, NextResponse } from 'next/server';
import { ApproveReturnCommand } from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../../../../../lib/sales-permissions';
import { handleApiError } from '../../../../../../../../lib/errors';
import { getSalesRepos, resolveWarehouseId } from '../../../../../sales/sales.deps';
import { serializeReturn } from '../../../../../sales/serialize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; returnId: string }> },
): Promise<NextResponse> {
  try {
    const { id, returnId } = await params;
    await assertSalesPermission(request, 'sales.refund.approve');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = (body ?? {}) as { approvedByUserId?: string };
    const approvedByUserId = parsed.approvedByUserId ?? getActorId(request);

    const companyId = getCompanyId(request);
    const repos = getSalesRepos();
    const warehouseId = await resolveWarehouseId(repos, companyId, 'branch-1');

    const command = new ApproveReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      null,
    );
    const returnEntity = await command.execute({
      companyId,
      orderId: id,
      returnId: returnId,
      approvedByUserId,
      warehouseId,
    });

    return NextResponse.json({ success: true, data: serializeReturn(returnEntity) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
