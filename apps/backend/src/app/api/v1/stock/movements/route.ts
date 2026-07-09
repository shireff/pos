import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../lib/inventory-permissions';
import { GetStockMovementsQuery } from '@packages/application-inventory';
import { MongoStockMovementEventRepository } from '@packages/infrastructure-mongodb';

const movementRepo = new MongoStockMovementEventRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.view');

    const url = new URL(request.url);
    const query = new GetStockMovementsQuery(movementRepo);
    const result = await query.execute({
      companyId: url.searchParams.get('companyId') ?? 'company-1',
      productId: url.searchParams.get('productId') ?? undefined,
      warehouseId: url.searchParams.get('warehouseId') ?? undefined,
      eventType: url.searchParams.get('eventType') as any,
      fromDate: url.searchParams.get('fromDate') ?? undefined,
      toDate: url.searchParams.get('toDate') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? '50'),
      offset: Number(url.searchParams.get('offset') ?? '0'),
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
