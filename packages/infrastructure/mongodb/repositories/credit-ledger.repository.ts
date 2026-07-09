import {
  CreditLedger,
  CreditLedgerBalanceRepository,
} from '@packages/application-crm';
import { getMongoDb } from '../src/mongo-connection';

export class MongoCreditLedgerBalanceRepository implements CreditLedgerBalanceRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('credit_ledger_entries'));
  }

  async findByCustomer(customerId: string, companyId: string): Promise<CreditLedger | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection<any>('credit_ledger_entries')
      .find({ customer_id: customerId, company_id: companyId })
      .sort({ occurred_at: -1 })
      .limit(1)
      .next();
    if (!doc) return null;
    return CreditLedger.reconstitute({
      companyId: doc.company_id,
      customerId: doc.customer_id,
      balancePiasters: doc.amount_piasters ?? 0,
      creditLimitPiasters: 0,
    });
  }

  async save(ledger: CreditLedger): Promise<void> {
    const db = await getMongoDb();
    const snap = ledger as any;
    await db.collection<any>('credit_ledger_entries').updateOne(
      { customer_id: snap.customerId, company_id: snap.companyId },
      {
        $set: {
          amount_piasters: snap.balancePiasters,
          updated_at: new Date(),
        },
      },
      { upsert: true },
    );
  }
}
