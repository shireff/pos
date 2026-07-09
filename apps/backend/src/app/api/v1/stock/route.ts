import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { assertInventoryPermission } from '../../../../lib/inventory-permissions';
import { z } from 'zod';
import {
  AdjustStockCommand,
  GetStockLevelsQuery,
  GetStockMovementsQuery,
} from '@packages/application-inventory';
import { StockEventType } from '@packages/domain-inventory';
import {
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
  MongoBatchRepository,
  MongoWarehouseRepository,
} from '@packages/infrastructure-mongodb';

const movementRepo = new MongoStockMovementEventRepository();
const stockItemRepo = new MongoStockItemRepository();
const batchRepo = new MongoBatchRepository();
const warehouseRepo = new MongoWarehouseRepository();

const AdjustStockSchema = z.object({
  companyId: z.string().min(1),
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  quantity: z.number().int(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  approvalThreshold: z.number().int().nonnegative().optional(),
});

const StockLevelsQuerySchema = z.object({
  companyId: z.string().min(1).default('company-1'),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  belowReorder: z.string().optional(),
});

const StockMovementsQuerySchema = z.object({
  companyId: z.string().min(1).default('company-1'),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.adjust');

    const body = await request.json();
    const parsed = AdjustStockSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e) => e.message).join('; '));
    }

    const command = new AdjustStockCommand(movementRepo, stockItemRepo, batchRepo, warehouseRepo);
    const result = await command.execute(parsed.data);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.view');

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'levels') {
      const parsed = StockLevelsQuerySchema.safeParse({
        companyId: url.searchParams.get('companyId') ?? undefined,
        warehouseId: url.searchParams.get('warehouseId') ?? undefined,
        productId: url.searchParams.get('productId') ?? undefined,
        belowReorder: url.searchParams.get('belowReorder') ?? undefined,
      });
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((e) => e.message).join('; '));
      }

      const command = new GetStockLevelsQuery(stockItemRepo);
      const items = await command.execute(parsed.data);

      return NextResponse.json({ success: true, data: items }, { status: 200 });
    }

    if (type === 'movements') {
      const parsed = StockMovementsQuerySchema.safeParse({
        companyId: url.searchParams.get('companyId') ?? undefined,
        productId: url.searchParams.get('productId') ?? undefined,
        warehouseId: url.searchParams.get('warehouseId') ?? undefined,
        eventType: url.searchParams.get('eventType') ?? undefined,
        fromDate: url.searchParams.get('fromDate') ?? undefined,
        toDate: url.searchParams.get('toDate') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
        offset: url.searchParams.get('offset') ?? undefined,
      });
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((e) => e.message).join('; '));
      }

      const query = new GetStockMovementsQuery(movementRepo);
      const result = await query.execute({
        ...parsed.data,
        eventType: parsed.data.eventType
          ? (parsed.data.eventType as StockEventType)
          : undefined,
      });

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid type parameter' } },
      { status: 400 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
