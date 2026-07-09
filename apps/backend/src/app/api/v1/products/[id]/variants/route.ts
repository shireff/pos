import { NextRequest, NextResponse } from 'next/server';
import { AddVariantUseCase } from '@packages/application-catalog';
import { assertCatalogPermission } from '../../../../../../lib/catalog-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { MongoProductRepository } from '../../../../../../lib/mongo-catalog-repository';
import { getAuthContext } from '../../../../../../lib/auth';
import { getMongoDb } from '../../../../../../lib/cloud-db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.view');

    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch { /* no-op */ }

    const db = await getMongoDb();
    const docs = await db.collection<any>('product_variants')
      .find({ product_id: id, is_deleted: { $ne: true } })
      .toArray();

    const variants = docs.map((v: any) => ({
      id: String(v._id),
      productId: id,
      companyId,
      sku: v.sku,
      barcode: v.barcode ?? null,
      name: v.name ?? null,
      pricePiasters: v.price_piasters ?? 0,
      costPiasters: v.cost_piasters ?? 0,
      additionalPricePiasters: v.additional_price_piasters ?? 0,
      attributesJson: v.attributes_json ?? {},
      isDeleted: v.is_deleted ?? false,
    }));

    return NextResponse.json({ success: true, data: { items: variants, total: variants.length } });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertCatalogPermission(request, 'catalog.create');

    const { id } = await context.params;

    let companyId = 'company-1';
    try {
      companyId = getAuthContext(request).companyId;
    } catch { /* no-op */ }

    const payload = await request.json();
    const useCase = new AddVariantUseCase(new MongoProductRepository());
    const variant = await useCase.execute({
      companyId,
      productId: id,
      sku: payload.sku,
      barcode: payload.barcode,
    });

    return NextResponse.json(
      { success: true, data: { sku: variant.sku, id: variant.id } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
