import {
  CreditLedger,
  CreditLedgerRepository,
} from '@packages/application-crm';
import { getMongoDb } from '../src/mongo-connection';

export class MongoCreditLedgerEntryRepository implements CreditLedgerRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('credit_ledger_entries'));
  }

  async findByCustomer(
    customerId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<import('@packages/domain-crm').CreditLedgerEntry[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('credit_ledger_entries')
      .find({ customer_id: customerId, company_id: companyId })
      .sort({ occurred_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async append(entry: import('@packages/domain-crm').CreditLedgerEntry): Promise<void> {
    const db = await getMongoDb();
    const snap = entry as any;
    await db.collection<any>('credit_ledger_entries').insertOne({
      _id: snap.id,
      company_id: snap.companyId,
      customer_id: snap.customerId,
      event_type: snap.eventType,
      amount_piasters: snap.amountPiasters,
      reference_type: snap.referenceType,
      reference_id: snap.referenceId,
      payment_method: snap.paymentMethod,
      reference_number: snap.referenceNumber,
      occurred_at: new Date(snap.occurredAt),
      created_at: new Date(snap.createdAt),
    });
  }

  async countByCustomer(customerId: string, companyId: string): Promise<number> {
    const db = await getMongoDb();
    return db.collection<any>('credit_ledger_entries').countDocuments({ customer_id: customerId, company_id: companyId });
  }

  private reconstitute(doc: any): import('@packages/domain-crm').CreditLedgerEntry {
    return import('@packages/domain-crm').CreditLedgerEntry.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      customerId: doc.customer_id,
      eventType: doc.event_type,
      amountPiasters: doc.amount_piasters,
      referenceType: doc.reference_type ?? null,
      referenceId: doc.reference_id ?? null,
      paymentMethod: doc.payment_method ?? null,
      referenceNumber: doc.reference_number ?? null,
      occurredAt: doc.occurred_at?.toISOString() || new Date().toISOString(),
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
    });
  }
}
