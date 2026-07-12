import { NextRequest, NextResponse } from 'next/server';
import { SubmitForApprovalCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, NotFoundError } from '../../../../../../lib/errors';
import { MongoPurchaseOrderRepository } from '@packages/infrastructure-mongodb';
import { serializePurchaseOrder } from '../../serialize';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.create');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    let threshold = Number(process.env.PURCHASE_AUTO_APPROVE_THRESHOLD_PIASTERS ?? '0');
    try {
      const body: { autoApproveThresholdPiasters?: number } = await request.json();
      if (typeof body.autoApproveThresholdPiasters === 'number') {
        threshold = body.autoApproveThresholdPiasters;
      }
    } catch {
      // empty body — use configured threshold
    }

    const repo = new MongoPurchaseOrderRepository();
    const po = await repo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    const command = new SubmitForApprovalCommand(repo);
    const result = await command.execute({
      poId: id,
      companyId,
      autoApproveThresholdPiasters: threshold,
    });

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrder: serializePurchaseOrder(result.purchaseOrder),
        autoApproved: result.autoApproved,
        requiresApproval: result.requiresApproval,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
