import {
  LoyaltyEvent,
  LoyaltyEventRepository,
} from '@packages/application-crm';
import { getMongoDb } from '../src/mongo-connection';

export class MongoLoyaltyEventRepository implements LoyaltyEventRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('loyalty_events'));
  }

  async findByCustomer(
    customerId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<LoyaltyEvent[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('loyalty_events')
      .find({ customer_id: customerId, company_id: companyId })
      .sort({ occurred_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async append(event: LoyaltyEvent): Promise<void> {
    const db = await getMongoDb();
    const snap = event as any;
    await db.collection<any>('loyalty_events').insertOne({
      _id: snap.id,
      company_id: snap.companyId,
      customer_id: snap.customerId,
      event_type: snap.eventType,
      amount_points: snap.amountPoints,
      reference_type: snap.referenceType,
      reference_id: snap.referenceId,
      occurred_at: new Date(snap.occurredAt),
      created_at: new Date(snap.createdAt),
    });
  }

  async countByCustomer(customerId: string, companyId: string): Promise<number> {
    const db = await getMongoDb();
    return db.collection<any>('loyalty_events').countDocuments({ customer_id: customerId, company_id: companyId });
  }

  private reconstitute(doc: any): LoyaltyEvent {
    return LoyaltyEvent.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      customerId: doc.customer_id,
      eventType: doc.event_type,
      amountPoints: doc.amount_points,
      referenceType: doc.reference_type ?? null,
      referenceId: doc.reference_id ?? null,
      occurredAt: doc.occurred_at?.toISOString() || new Date().toISOString(),
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
    });
  }
}
