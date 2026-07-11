import { PaymentMethod, PaymentMethodProps } from '@packages/domain-sales';
import { getMongoDb } from '../src/mongo-connection';
import { PaymentMethodRepository } from '@packages/application-sales';

export class MongoPaymentMethodRepository implements PaymentMethodRepository {
  async findByCompany(companyId: string): Promise<PaymentMethod[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('payment_methods')
      .find({ company_id: companyId })
      .toArray();
    return docs.map((doc) => PaymentMethod.reconstitute(this.mapProps(doc)));
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('payment_methods').findOne({ _id: id });
    if (!doc) return null;
    return PaymentMethod.reconstitute(this.mapProps(doc));
  }

  async save(method: PaymentMethod): Promise<void> {
    const db = await getMongoDb();
    const snap = method as any;
    const now = new Date();
    await db.collection<any>('payment_methods').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          tender_type: snap.tenderType,
          is_enabled: snap.isEnabled,
          display_name_ar: snap.displayNameAr,
          display_name_en: snap.displayNameEn,
          configuration: snap.configuration,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  private mapProps(doc: any): PaymentMethodProps {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      tenderType: doc.tender_type,
      isEnabled: doc.is_enabled,
      displayNameAr: doc.display_name_ar,
      displayNameEn: doc.display_name_en,
      configuration: doc.configuration ?? null,
    };
  }
}
