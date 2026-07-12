import { NextRequest, NextResponse } from 'next/server';
import { VoidSaleCommand } from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { getSalesRepos, resolveWarehouseId } from '../../../sales/sales.deps';
import { VoidSaleSchema } from '../../../sales/sales.schemas';
import { serializeOrder } from '../../../sales/serialize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSalesPermission(request, 'sales.void');

    const body: unknown = await request.json();
    const parsed = VoidSaleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const voidedByUserId = data.voidedByUserId ?? getActorId(request);
    const repos = getSalesRepos();
    const warehouseId = data.warehouseId ?? (await resolveWarehouseId(repos, companyId, 'branch-1'));

    const command = new VoidSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      null,
    );
    const order = await command.execute({
      companyId,
      orderId: id,
      voidedByUserId,
      reason: data.reason,
      currentShiftSessionId: data.currentShiftSessionId ?? null,
      warehouseId,
    });

    return NextResponse.json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
