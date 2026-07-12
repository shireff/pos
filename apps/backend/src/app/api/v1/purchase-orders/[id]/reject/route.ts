import { NextRequest, NextResponse } from 'next/server';
import { RejectPurchaseOrderCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError, NotFoundError } from '../../../../../../lib/errors';
import { MongoPurchaseOrderRepository } from '@packages/infrastructure-mongodb';
import { RejectPurchaseOrderSchema } from '../../purchases.schemas';
import { serializePurchaseOrder } from '../../serialize';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.approve');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = RejectPurchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const repo = new MongoPurchaseOrderRepository();
    const po = await repo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    const command = new RejectPurchaseOrderCommand(repo);
    const updated = await command.execute({
      poId: id,
      companyId,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, data: serializePurchaseOrder(updated) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
