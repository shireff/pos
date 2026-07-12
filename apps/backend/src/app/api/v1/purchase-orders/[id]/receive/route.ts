import { NextRequest, NextResponse } from 'next/server';
import { ReceiveGoodsCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission, getActorId } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError, NotFoundError } from '../../../../../../lib/errors';
import {
  MongoPurchaseOrderRepository,
  MongoGoodsReceiptRepository,
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
} from '@packages/infrastructure-mongodb';
import { ReceiveGoodsSchema } from '../../purchases.schemas';
import { serializePurchaseOrder } from '../../serialize';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.receive');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = ReceiveGoodsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const poRepo = new MongoPurchaseOrderRepository();
    const po = await poRepo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    const command = new ReceiveGoodsCommand(
      poRepo,
      new MongoGoodsReceiptRepository(),
      new MongoStockMovementEventRepository(),
      new MongoStockItemRepository(),
    );

    const result = await command.execute({
      poId: id,
      companyId,
      receivedByUserId: parsed.data.receivedByUserId ?? getActorId(request),
      notes: parsed.data.notes ?? null,
      lines: parsed.data.lines.map((l) => ({
        lineId: l.lineId,
        warehouseId: l.warehouseId,
        receivedQuantity: l.receivedQuantity,
        discrepancyType: l.discrepancyType ?? null,
        discrepancyNotes: l.discrepancyNotes ?? null,
      })),
    });

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrder: serializePurchaseOrder(result.purchaseOrder),
        goodsReceiptId: result.goodsReceipt.id,
        discrepancies: result.goodsReceipt.discrepancies.map((d) => ({
          type: d.type,
          expectedQuantity: d.expectedQuantity,
          actualQuantity: d.actualQuantity,
          notes: d.notes,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
