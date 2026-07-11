import { Db } from 'mongodb';
import { PriceChange, PriceChangeStatus } from '@packages/domain-tax';
import { PriceChangeRepository } from '@packages/application-tax';
import { getMongoDb } from '../src/mongo-connection';

export class MongoPriceChangeRepository implements PriceChangeRepository {
  async findById(id: string, companyId: string): Promise<PriceChange | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('price_changes').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByProduct(
    companyId: string,
    productId: string,
    status?: PriceChangeStatus,
  ): Promise<PriceChange[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId, product_id: productId };
    if (status) query.status = status;

    const docs = await db.collection<any>('price_changes').find(query).sort({ requested_at: -1 }).toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async findByCompanyPendingApproval(companyId: string): Promise<PriceChange[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('price_changes')
      .find({ company_id: companyId, status: 'pending_approval' })
      .sort({ requested_at: -1 })
      .toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async save(priceChange: PriceChange): Promise<void> {
    const db = await getMongoDb();
    const snap = priceChange as any;
    await db.collection<any>('price_changes').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          product_id: snap.productId,
          variant_id: snap.variantId,
          old_price_piasters: snap.oldPricePiasters,
          new_price_piasters: snap.newPricePiasters,
          requested_by_user_id: snap.requestedByUserId,
          approved_by_user_id: snap.approvedByUserId,
          status: snap.status,
          notes: snap.notes,
          requested_at: new Date(snap.requestedAt),
          approved_at: snap.approvedAt ? new Date(snap.approvedAt) : null,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): PriceChange {
    return PriceChange.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      productId: doc.product_id,
      variantId: doc.variant_id ?? null,
      oldPricePiasters: doc.old_price_piasters,
      newPricePiasters: doc.new_price_piasters,
      requestedByUserId: doc.requested_by_user_id,
      approvedByUserId: doc.approved_by_user_id ?? null,
      status: doc.status,
      notes: doc.notes ?? null,
      requestedAt: doc.requested_at?.toISOString() || new Date().toISOString(),
      approvedAt: doc.approved_at?.toISOString() ?? null,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
