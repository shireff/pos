import { PaymentTransaction, PaymentTransactionProps } from '@packages/domain-sales';
import { getMongoDb } from '../src/mongo-connection';
import { PaymentTransactionRepository } from '@packages/application-sales';

export class MongoPaymentTransactionRepository implements PaymentTransactionRepository {
  async findById(id: string): Promise<PaymentTransaction | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('payment_transactions').findOne({ _id: id });
    if (!doc) return null;
    return PaymentTransaction.reconstitute(this.mapProps(doc));
  }

  async findByOrder(orderId: string): Promise<PaymentTransaction[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('payment_transactions')
      .find({ order_id: orderId })
      .sort({ created_at: 1 })
      .toArray();
    return docs.map((doc) => PaymentTransaction.reconstitute(this.mapProps(doc)));
  }

  async findByCompanyAndDateRange(
    companyId: string,
    from: string,
    to: string,
  ): Promise<PaymentTransaction[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('payment_transactions')
      .find({
        company_id: companyId,
        created_at: { $gte: new Date(from), $lte: new Date(to) },
      })
      .sort({ created_at: -1 })
      .toArray();
    return docs.map((doc) => PaymentTransaction.reconstitute(this.mapProps(doc)));
  }

  async save(transaction: PaymentTransaction): Promise<void> {
    const db = await getMongoDb();
    const snap = transaction as any;
    const now = new Date();
    await db.collection<any>('payment_transactions').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          order_id: snap.orderId,
          tender_type: snap.tenderType,
          amount_piasters: snap.amountPiasters,
          provider_id: snap.providerId,
          status: snap.status,
          external_reference: snap.externalReference,
          processed_at: snap.processedAt,
          created_at: snap.createdAt ? new Date(snap.createdAt) : now,
        },
      },
      { upsert: true },
    );
  }

  private mapProps(doc: any): PaymentTransactionProps {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      orderId: doc.order_id.toString(),
      tenderType: doc.tender_type,
      amountPiasters: doc.amount_piasters,
      providerId: doc.provider_id ?? null,
      status: doc.status,
      externalReference: doc.external_reference ?? null,
      processedAt: doc.processed_at ?? null,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
    };
  }
}
