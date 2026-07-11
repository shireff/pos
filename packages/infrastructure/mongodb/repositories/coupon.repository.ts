import { Db } from 'mongodb';
import { Coupon } from '@packages/domain-promotions';
import { CouponRepository } from '@packages/application-promotions';
import { getMongoDb } from '../src/mongo-connection';

export class MongoCouponRepository implements CouponRepository {
  async findById(id: string, companyId: string): Promise<Coupon | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('coupons').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByCompany(companyId: string): Promise<Coupon[]> {
    const db = await getMongoDb();
    const docs = await db.collection<any>('coupons').find({ company_id: companyId }).toArray();
    return docs.map((d) => this.reconstitute(d));
  }

  async findByCode(code: string, companyId: string): Promise<Coupon | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('coupons').findOne({ code, company_id: companyId });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async save(coupon: Coupon): Promise<void> {
    const db = await getMongoDb();
    const snap = coupon as any;
    await db.collection<any>('coupons').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          code: snap.code,
          discount_type: snap.discountType,
          amount: snap.amount,
          is_multi_use: snap.isMultiUse,
          usage_limit: snap.usageLimit,
          expires_at: snap.expiresAt ? new Date(snap.expiresAt) : null,
          scope_type: snap.scopeType,
          scope_ids: snap.scopeIds,
          is_active: snap.isActive,
          is_deleted: snap.isDeleted,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): Coupon {
    return Coupon.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      code: doc.code,
      discountType: doc.discount_type,
      amount: doc.amount,
      isMultiUse: doc.is_multi_use,
      usageLimit: doc.usage_limit,
      usageCount: doc.usage_count ?? 0,
      expiresAt: doc.expires_at?.toISOString() ?? null,
      scopeType: doc.scope_type,
      scopeIds: doc.scope_ids ?? [],
      isActive: doc.is_active,
      isDeleted: doc.is_deleted ?? false,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
