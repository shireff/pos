import { Return, ReturnLine } from '@packages/domain-sales';
import { getMongoDb } from '../src/mongo-connection';
import { ReturnRepository } from '@packages/application-sales';

export class MongoReturnRepository implements ReturnRepository {
  async findById(id: string): Promise<Return | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('returns').findOne({ _id: id });
    if (!doc) return null;
    return this.reconstitute(db, doc);
  }

  async findByOrder(orderId: string): Promise<Return[]> {
    const db = await getMongoDb();
    const docs = await db.collection<any>('returns').find({ original_order_id: orderId }).toArray();
    return Promise.all(docs.map((d) => this.reconstitute(db, d)));
  }

  async findPendingApproval(companyId: string): Promise<Return[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('returns')
      .find({ company_id: companyId, status: 'pending_approval' })
      .toArray();
    return Promise.all(docs.map((d) => this.reconstitute(db, d)));
  }

  private async reconstitute(_db: any, r: any): Promise<Return> {
    const db = await getMongoDb();
    const lineDocs = await db
      .collection<any>('return_lines')
      .find({ return_id: r._id })
      .toArray();
    const lines = lineDocs.map((l) =>
      ReturnLine.reconstitute({
        id: l._id.toString(),
        returnId: l.return_id.toString(),
        originalOrderLineId: l.original_order_line_id,
        productVariantId: l.product_variant_id,
        batchId: l.batch_id ?? null,
        quantity: l.quantity,
        refundAmountPiasters: l.refund_amount_piasters,
      }),
    );

    const snap = Return.reconstitute({
      id: r._id.toString(),
      originalOrderId: r.original_order_id,
      returnedByUserId: r.returned_by_user_id,
      approvedByUserId: r.approved_by_user_id ?? null,
      reason: r.reason,
      refundMethod: r.refund_method,
      status: r.status,
      refundAmountPiasters: r.refund_amount_piasters,
      createdAt: r.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
      lines: lines.map((rl) => ({
        id: rl.id,
        returnId: rl.returnId,
        originalOrderLineId: rl.originalOrderLineId,
        productVariantId: rl.productVariantId,
        batchId: rl.batchId,
        quantity: rl.quantity,
        refundAmountPiasters: rl.refundAmountPiasters,
      })),
    });
    return snap;
  }

  async save(returnEntity: Return): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = returnEntity as any;
    await db.collection<any>('returns').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId ?? null,
          original_order_id: snap.originalOrderId,
          returned_by_user_id: snap.returnedByUserId,
          approved_by_user_id: snap.approvedByUserId,
          reason: snap.reason,
          refund_method: snap.refundMethod,
          status: snap.status,
          refund_amount_piasters: snap.refundAmountPiasters,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );

    for (const line of snap.lines as ReturnLine[]) {
      await db.collection<any>('return_lines').updateOne(
        { _id: line.id },
        {
          $set: {
            return_id: line.returnId,
            original_order_line_id: line.originalOrderLineId,
            product_variant_id: line.productVariantId,
            batch_id: line.batchId,
            quantity: line.quantity,
            refund_amount_piasters: line.refundAmountPiasters,
          },
        },
        { upsert: true },
      );
    }
  }
}
