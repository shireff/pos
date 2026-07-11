import { Db } from 'mongodb';
import { TaxRule } from '@packages/domain-tax';
import { TaxRuleRepository } from '@packages/application-tax';
import { getMongoDb } from '../src/mongo-connection';

export class MongoTaxRuleRepository implements TaxRuleRepository {
  async findById(id: string, companyId: string): Promise<TaxRule | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('tax_rules').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByCompany(companyId: string, filter?: { isActive?: boolean }): Promise<TaxRule[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (filter?.isActive !== undefined) query.is_active = filter.isActive;

    const docs = await db.collection<any>('tax_rules').find(query).sort({ priority: 1 }).toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async save(taxRule: TaxRule): Promise<void> {
    const db = await getMongoDb();
    const snap = taxRule as any;
    await db.collection<any>('tax_rules').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          rate_percent: snap.ratePercent,
          applicable_to: snap.appliesTo,
          scope_ids: snap.scopeIds,
          priority: snap.priority,
          is_active: snap.isActive,
          is_deleted: snap.isDeleted,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): TaxRule {
    return TaxRule.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      name: doc.name,
      rateBasisPoints: doc.rate_percent * 100,
      appliesTo: doc.applicable_to,
      scopeIds: doc.scope_ids ?? [],
      priority: doc.priority ?? 0,
      isActive: doc.is_active,
      isDeleted: doc.is_deleted ?? false,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
