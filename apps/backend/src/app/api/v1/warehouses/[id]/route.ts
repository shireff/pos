import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../lib/inventory-permissions';
import { MongoWarehouseRepository } from '@packages/infrastructure-mongodb';

const repo = new MongoWarehouseRepository();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.batch.manage');

    const { id } = await context.params;
    const body = await request.json();

    const warehouse = await repo.findById(id);
    if (!warehouse || warehouse.isDeleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Warehouse not found' } },
        { status: 404 },
      );
    }

    if (body.name) warehouse.rename(body.name);
    if (body.address !== undefined) warehouse.updateAddress(body.address);
    if (body.managerId !== undefined) warehouse.updateManager(body.managerId);

    await repo.save(warehouse);

    return NextResponse.json({ success: true, data: warehouse }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
