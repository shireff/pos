import { Supplier, SupplierContact } from '@packages/domain-purchasing';
import { SupplierRepository, SupplierFilter } from '@packages/application-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoSupplierRepository implements SupplierRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('suppliers'));
  }

  async findById(id: string, companyId: string): Promise<Supplier | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('suppliers').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByCompany(companyId: string, filter?: SupplierFilter): Promise<Supplier[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (filter?.isActive !== undefined) query.is_active = filter.isActive;
    if (filter?.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [
        { 'name.ar': regex },
        { 'name.en': regex },
        { phone: regex },
        { email: regex },
      ];
    }
    let cursor = db.collection<any>('suppliers').find(query).sort({ created_at: -1 });
    if (filter?.limit) cursor = cursor.limit(filter.limit);
    if (filter?.offset) cursor = cursor.skip(filter.offset);
    const docs = await cursor.toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async findByPhone(phone: string, companyId: string): Promise<Supplier | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('suppliers').findOne({ phone, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async save(supplier: Supplier): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = supplier as any;
    await db.collection<any>('suppliers').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          phone: snap.phone,
          email: snap.email,
          address: snap.address,
          tax_id: snap.taxId,
          payment_terms_days: snap.paymentTermsDays,
          currency: snap.currency,
          is_active: snap.isActive,
          contacts: snap.contacts.map((c: SupplierContact) => ({
            name: c.name,
            phone: c.phone,
            email: c.email,
            role: c.role,
          })),
          hlc_timestamp: new Date().toISOString(),
          sync_version: 1,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): Supplier {
    const contacts = (doc.contacts ?? []).map((c: any) =>
      SupplierContact.reconstitute({
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        role: c.role ?? null,
      }),
    );
    return Supplier.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      name: doc.name,
      phone: doc.phone,
      email: doc.email ?? null,
      address: doc.address ?? null,
      taxId: doc.tax_id ?? null,
      paymentTermsDays: doc.payment_terms_days ?? 0,
      currency: doc.currency ?? 'EGP',
      isActive: doc.is_active ?? true,
      contacts,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
