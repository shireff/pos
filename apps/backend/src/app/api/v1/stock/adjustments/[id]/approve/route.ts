import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../../../lib/inventory-permissions';
import { ApproveAdjustmentCommand } from '@packages/application-inventory';
import { MongoStockMovementEventRepository, MongoStockItemRepository } from '@packages/infrastructure-mongodb';

const movementRepo = new MongoStockMovementEventRepository();
const stockItemRepo = new MongoStockItemRepository();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.adjust.approve');

    const { id } = await context.params;
    const body = await request.json();
    const command = new ApproveAdjustmentCommand(movementRepo, stockItemRepo);
    const result = await command.execute({
      companyId: body.companyId ?? 'company-1',
      movementEventId: id,
      approvedByUserId: body.approvedByUserId,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
