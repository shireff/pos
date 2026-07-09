import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../../../lib/inventory-permissions';
import { ReceiveTransferCommand } from '@packages/application-inventory';
import {
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
  MongoStockTransferRepository,
} from '@packages/infrastructure-mongodb';

const transferRepo = new MongoStockTransferRepository();
const movementRepo = new MongoStockMovementEventRepository();
const stockItemRepo = new MongoStockItemRepository();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.transfer.receive');

    const { id } = await context.params;
    const body = await request.json();
    const command = new ReceiveTransferCommand(transferRepo, movementRepo, stockItemRepo);
    const result = await command.execute({
      companyId: body.companyId ?? 'company-1',
      transferId: id,
      lineReceivedQuantities: body.lineReceivedQuantities,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
