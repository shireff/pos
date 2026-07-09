import { NextRequest, NextResponse } from 'next/server';
import { ApprovePurchaseOrderCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission, getActorId } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, NotFoundError } from '../../../../../../lib/errors';
import { MongoPurchaseOrderRepository } from '@packages/infrastructure-mongodb';
import { serializePurchaseOrder } from '../../route';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.approve');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoPurchaseOrderRepository();
    const po = await repo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    const command = new ApprovePurchaseOrderCommand(repo);
    const updated = await command.execute({
      poId: id,
      companyId,
      approvedByUserId: getActorId(request),
    });

    return NextResponse.json({ success: true, data: serializePurchaseOrder(updated) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
