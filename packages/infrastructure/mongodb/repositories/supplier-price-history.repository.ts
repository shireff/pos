import { SupplierPriceHistory } from '@packages/domain-purchasing';
import { SupplierPriceHistoryRepository } from '@packages/application-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoSupplierPriceHistoryRepository implements SupplierPriceHistoryRepository {
  async findBySupplier(
    supplierId: string,
    companyId: string,
    productId?: string,
    limit = 50,
    offset = 0,
  ): Promise<SupplierPriceHistory[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {
      supplier_id: supplierId,
      company_id: companyId,
    };
    if (productId) query.product_id = productId;

    const docs = await db
      .collection<any>('supplier_price_history')
      .find(query)
      .sort({ recorded_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) =>
      SupplierPriceHistory.reconstitute({
        id: d._id.toString(),
        supplierId: d.supplier_id.toString(),
        companyId: d.company_id.toString(),
        productId: d.product_id.toString(),
        variantId: d.variant_id ?? null,
        unitPricePiasters: d.unit_price_piasters,
        effectiveDate: d.effective_date?.toISOString() || new Date().toISOString(),
        recordedAt: d.recorded_at?.toISOString() || new Date().toISOString(),
        purchaseOrderId: d.purchase_order_id ?? null,
        createdAt: d.created_at?.toISOString() || new Date().toISOString(),
      }),
    );
  }

  async save(entry: SupplierPriceHistory): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = entry as any;
    await db.collection<any>('supplier_price_history').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          supplier_id: snap.supplierId,
          product_id: snap.productId,
          variant_id: snap.variantId,
          unit_price_piasters: snap.unitPricePiasters,
          effective_date: new Date(snap.effectiveDate),
          recorded_at: new Date(snap.recordedAt),
          purchase_order_id: snap.purchaseOrderId,
          created_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }
}
