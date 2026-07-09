import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../lib/inventory-permissions';
import { TransferStockCommand } from '@packages/application-inventory';
import {
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
  MongoWarehouseRepository,
  MongoStockTransferRepository,
} from '@packages/infrastructure-mongodb';

const transferRepo = new MongoStockTransferRepository();
const warehouseRepo = new MongoWarehouseRepository();
const movementRepo = new MongoStockMovementEventRepository();
const stockItemRepo = new MongoStockItemRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.transfer.create');

    const body = await request.json();
    const command = new TransferStockCommand(
      transferRepo,
      warehouseRepo,
      movementRepo,
      stockItemRepo,
    );
    const result = await command.execute({
      companyId: body.companyId ?? 'company-1',
      fromWarehouseId: body.fromWarehouseId,
      toWarehouseId: body.toWarehouseId,
      requestedByUserId: body.requestedByUserId ?? 'user-1',
      lines: body.lines,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.view');

    const url = new URL(request.url);
    const warehouseId = url.searchParams.get('warehouseId') ?? undefined;

    const items = await transferRepo.findByWarehouse(warehouseId ?? '');
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
