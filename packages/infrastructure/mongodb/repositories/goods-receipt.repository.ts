import { Db } from 'mongodb';
import { GoodsReceipt, GoodsReceiptLineProps, GoodsReceiptDiscrepancyProps } from '@packages/domain-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoGoodsReceiptRepository {
  async findById(id: string): Promise<GoodsReceipt | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('goods_receipts').findOne({ _id: id });
    if (!doc) return null;
    return this.hydrate(db, doc);
  }

  async findByPurchaseOrder(purchaseOrderId: string): Promise<GoodsReceipt[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('goods_receipts')
      .find({ purchase_order_id: purchaseOrderId })
      .sort({ received_at: -1 })
      .toArray();
    const results: GoodsReceipt[] = [];
    for (const doc of docs) {
      const gr = await this.hydrate(db, doc);
      results.push(gr);
    }
    return results;
  }

  async save(gr: GoodsReceipt): Promise<void> {
    const db = await getMongoDb();
    const snap = gr as unknown as {
      id: string;
      companyId: string;
      purchaseOrderId: string;
      receivedByUserId: string;
      receivedAt: string;
      notes: string | null;
      updatedAt: string;
      lines: readonly GoodsReceiptLineProps[];
      discrepancies: readonly GoodsReceiptDiscrepancyProps[];
    };
    const now = new Date();

    await db.collection<any>('goods_receipts').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          purchase_order_id: snap.purchaseOrderId,
          received_by_user_id: snap.receivedByUserId,
          received_at: new Date(snap.receivedAt),
          notes: snap.notes,
          hlc_timestamp: new Date().toISOString(),
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );

    // Receipt lines are immutable once created — replace the set on each save.
    await db.collection<any>('goods_receipt_lines').deleteMany({ goods_receipt_id: snap.id });
    if (snap.lines.length > 0) {
      await db.collection<any>('goods_receipt_lines').insertMany(
        snap.lines.map((l: GoodsReceiptLineProps) => ({
          _id: l.id,
          goods_receipt_id: l.goodsReceiptId,
          purchase_order_line_id: l.purchaseOrderLineId,
          product_id: l.productId,
          variant_id: l.variantId,
          warehouse_id: l.warehouseId,
          received_quantity: l.receivedQuantity,
          discrepancy_type: l.discrepancyType,
          discrepancy_notes: l.discrepancyNotes,
          created_at: now,
          updated_at: now,
        })),
      );
    }

    // Discrepancies are append-only — only insert ones not already stored.
    const existing = await db
      .collection<any>('goods_receipt_discrepancies')
      .find({ goods_receipt_id: snap.id })
      .toArray();
    const existingIds = new Set(existing.map((d: any) => d._id.toString()));
    const newDiscrepancies = snap.discrepancies.filter(
      (d: GoodsReceiptDiscrepancyProps) => !existingIds.has(d.id),
    );
    if (newDiscrepancies.length > 0) {
      await db.collection<any>('goods_receipt_discrepancies').insertMany(
        newDiscrepancies.map((d: GoodsReceiptDiscrepancyProps) => ({
          _id: d.id,
          goods_receipt_id: d.goodsReceiptId,
          purchase_order_line_id: d.purchaseOrderLineId,
          type: d.type,
          expected_quantity: d.expectedQuantity,
          actual_quantity: d.actualQuantity,
          notes: d.notes,
          created_at: now,
        })),
      );
    }
  }

  private async hydrate(db: Db, doc: any): Promise<GoodsReceipt> {
    const [lineDocs, discDocs] = await Promise.all([
      db.collection<any>('goods_receipt_lines').find({ goods_receipt_id: doc._id.toString() }).toArray(),
      db.collection<any>('goods_receipt_discrepancies').find({ goods_receipt_id: doc._id.toString() }).toArray(),
    ]);

    const lines: GoodsReceiptLineProps[] = lineDocs.map((l: any) => ({
      id: l._id.toString(),
      goodsReceiptId: l.goods_receipt_id.toString(),
      purchaseOrderLineId: l.purchase_order_line_id.toString(),
      productId: l.product_id.toString(),
      variantId: l.variant_id ? l.variant_id.toString() : null,
      warehouseId: l.warehouse_id.toString(),
      receivedQuantity: l.received_quantity,
      discrepancyType: l.discrepancy_type ?? null,
      discrepancyNotes: l.discrepancy_notes ?? null,
    }));

    const discrepancies: GoodsReceiptDiscrepancyProps[] = discDocs.map((d: any) => ({
      id: d._id.toString(),
      goodsReceiptId: d.goods_receipt_id.toString(),
      purchaseOrderLineId: d.purchase_order_line_id.toString(),
      type: d.type,
      expectedQuantity: d.expected_quantity,
      actualQuantity: d.actual_quantity,
      notes: d.notes ?? '',
    }));

    return GoodsReceipt.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        purchaseOrderId: doc.purchase_order_id.toString(),
        receivedByUserId: doc.received_by_user_id.toString(),
        receivedAt: new Date(doc.received_at).toISOString(),
        notes: doc.notes ?? null,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
      },
      lines,
      discrepancies,
    );
  }
}
