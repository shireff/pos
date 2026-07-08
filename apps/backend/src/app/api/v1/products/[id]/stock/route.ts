import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '../../../../../../lib/auth';
import { getMongoDb } from '../../../../../../lib/cloud-db';
import { handleApiError } from '../../../../../../lib/errors';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch {
      /* no-op */
    }

    const db = await getMongoDb();

    // Aggregate stock from stock_movement_events by product-variant
    const pipeline = [
      {
        $match: {
          // filter by product's variants — using company_id from products collection
          product_variant_id: { $regex: `^${id}` },
        },
      },
      {
        $group: {
          _id: { warehouseId: '$warehouse_id', variantId: '$product_variant_id' },
          totalDelta: { $sum: '$quantity_delta' },
        },
      },
      {
        $project: {
          _id: 0,
          warehouseId: '$_id.warehouseId',
          variantId: '$_id.variantId',
          quantity: '$totalDelta',
        },
      },
    ];

    const stockItems = await db.collection('stock_movement_events').aggregate(pipeline).toArray();

    return NextResponse.json(
      {
        success: true,
        data: {
          productId: id,
          companyId,
          items: stockItems.length > 0 ? stockItems : [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
