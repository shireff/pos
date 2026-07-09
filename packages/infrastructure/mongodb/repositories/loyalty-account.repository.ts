import {
  LoyaltyAccount,
  LoyaltyAccountRepository,
} from '@packages/application-crm';
import { getMongoDb } from '../src/mongo-connection';

export class MongoLoyaltyAccountRepository implements LoyaltyAccountRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('loyalty_accounts'));
  }

  async findByCustomer(customerId: string, companyId: string): Promise<LoyaltyAccount | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('loyalty_accounts').findOne({ customer_id: customerId, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async save(account: LoyaltyAccount): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = account as any;
    await db.collection<any>('loyalty_accounts').updateOne(
      { customer_id: snap.customerId, company_id: snap.companyId },
      {
        $set: {
          points_balance: snap.pointsBalance,
          tier_id: snap.tierId,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): LoyaltyAccount {
    return LoyaltyAccount.reconstitute({
      companyId: doc.company_id,
      customerId: doc.customer_id,
      pointsBalance: doc.points_balance ?? 0,
      tierId: doc.tier_id,
    });
  }
}
