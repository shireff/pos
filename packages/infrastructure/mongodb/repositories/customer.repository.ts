import { Db } from 'mongodb';
import {
  Customer,
  CustomerFilter,
  CustomerRepository,
} from '@packages/application-crm';
import { getMongoDb } from '../src/mongo-connection';

export class MongoCustomerRepository implements CustomerRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('customers'));
  }

  async findById(id: string, companyId: string): Promise<Customer | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('customers').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByCompany(companyId: string, filter?: CustomerFilter): Promise<Customer[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (filter?.isActive !== undefined) query.is_active = filter.isActive;
    if (filter?.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { loyalty_code: regex },
      ];
    }
    const docs = await db.collection<any>('customers').find(query).sort({ created_at: -1 }).toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async findByPhone(phone: string, companyId: string): Promise<Customer | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('customers').findOne({ phone, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async save(customer: Customer): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = customer as any;
    await db.collection<any>('customers').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          phone: snap.phone,
          email: snap.email,
          loyalty_code: snap.loyaltyCode,
          loyalty_tier_id: snap.loyaltyTierId,
          credit_limit_piasters: snap.creditLimitPiasters,
          is_active: snap.isActive,
          notes: snap.notes,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): Customer {
    return Customer.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      name: doc.name,
      phone: doc.phone,
      email: doc.email ?? null,
      loyaltyCode: doc.loyalty_code,
      loyaltyTierId: doc.loyalty_tier_id,
      creditLimitPiasters: doc.credit_limit_piasters ?? 0,
      isActive: doc.is_active ?? true,
      notes: doc.notes ?? null,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
