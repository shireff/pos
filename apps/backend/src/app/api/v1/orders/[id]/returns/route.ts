import { NextRequest, NextResponse } from 'next/server';
import { ProcessReturnCommand } from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { getSalesRepos, resolveWarehouseId } from '../../../sales/sales.deps';
import { ProcessReturnSchema } from '../../../sales/sales.schemas';
import { serializeReturn } from '../../../sales/serialize';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.return.create');

    const body: unknown = await request.json();
    const parsed = ProcessReturnSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const returnedByUserId = data.returnedByUserId ?? getActorId(request);
    const repos = getSalesRepos();
    const warehouseId = data.warehouseId ?? (await resolveWarehouseId(repos, companyId, 'branch-1'));

    const command = new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      null,
    );
    const { returnEntity, autoApproved } = await command.execute({
      companyId,
      orderId: params.id,
      returnedByUserId,
      reason: data.reason,
      warehouseId,
      lines: data.lines.map((l) => ({
        orderLineId: l.orderLineId,
        productVariantId: l.productVariantId,
        productId: l.productId,
        batchId: l.batchId ?? null,
        returnQuantity: l.returnQuantity,
        refundAmountPiasters: l.refundAmountPiasters,
      })),
      refundMethod: data.refundMethod,
      refundApprovalThresholdPiasters: data.refundApprovalThresholdPiasters ?? 0,
    });

    return NextResponse.json(
      { success: true, data: serializeReturn(returnEntity), autoApproved },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
