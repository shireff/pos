import { NextRequest, NextResponse } from 'next/server';
import { UpdatePurchaseOrderCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission } from '../../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError, NotFoundError } from '../../../../../lib/errors';
import { MongoPurchaseOrderRepository } from '@packages/infrastructure-mongodb';
import { UpdatePurchaseOrderSchema } from '../purchases.schemas';
import { serializePurchaseOrder } from '../serialize';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.view');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoPurchaseOrderRepository();
    const po = await repo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    return NextResponse.json({ success: true, data: serializePurchaseOrder(po) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.edit');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = UpdatePurchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const repo = new MongoPurchaseOrderRepository();
    const command = new UpdatePurchaseOrderCommand(repo);
    const po = await command.execute({
      poId: id,
      companyId,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate,
      notes: parsed.data.notes,
      lines: parsed.data.lines?.map((l) => ({
        id: l.id,
        orderedQuantity: l.orderedQuantity,
        unitPricePiasters: l.unitPricePiasters,
      })),
    });

    return NextResponse.json({ success: true, data: serializePurchaseOrder(po) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
