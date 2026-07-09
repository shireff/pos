import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../lib/errors';
import { assertInventoryPermission } from '../../../../lib/inventory-permissions';
import { MongoWarehouseRepository } from '@packages/infrastructure-mongodb';

const repo = new MongoWarehouseRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.view');

    const ctx = (request as any).auth ?? {};
    const companyId = ctx.companyId ?? 'company-1';
    const warehouses = await repo.findByCompany(companyId);

    return NextResponse.json({ success: true, data: warehouses }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.batch.manage');

    const body = await request.json();
    const companyId = body.companyId ?? 'company-1';

    const { Warehouse } = await import('@packages/domain-inventory');
    const warehouse = Warehouse.create({
      companyId,
      name: body.name,
      address: body.address ?? null,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
      managerId: body.managerId ?? null,
    });

    await repo.save(warehouse);

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
