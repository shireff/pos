import { Db } from 'mongodb';
import { Discount } from '@packages/domain-promotions';
import { DiscountRepository } from '@packages/application-promotions';
import { getMongoDb } from '../src/mongo-connection';

export class MongoDiscountRepository implements DiscountRepository {
  async findById(id: string, companyId: string): Promise<Discount | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('discount_rules').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByCompany(
    companyId: string,
    type?: string,
    isActive?: boolean,
  ): Promise<Discount[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (isActive !== undefined) query.is_active = isActive;
    if (type) query.type = type;

    const docs = await db.collection<any>('discount_rules').find(query).sort({ priority: 1 }).toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async save(discount: Discount): Promise<void> {
    const db = await getMongoDb();
    const snap = discount as any;
    await db.collection<any>('discount_rules').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          type: snap.type,
          rule_json: snap.ruleJson,
          is_active: snap.isActive,
          valid_from: snap.validFrom ? new Date(snap.validFrom) : null,
          valid_until: snap.validUntil ? new Date(snap.validUntil) : null,
          priority: snap.priority,
          is_exclusive: snap.isExclusive,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): Discount {
    return Discount.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      name: doc.name,
      type: doc.type,
      ruleJson: doc.rule_json,
      isActive: doc.is_active,
      validFrom: doc.valid_from?.toISOString() ?? null,
      validUntil: doc.valid_until?.toISOString() ?? null,
      priority: doc.priority ?? 0,
      isExclusive: doc.is_exclusive ?? false,
      isDeleted: doc.is_deleted ?? false,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
