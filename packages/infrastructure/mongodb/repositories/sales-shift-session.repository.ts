import { ShiftSession } from '@packages/domain-sales';
import { getMongoDb } from '../src/mongo-connection';
import { ShiftSessionRepository } from '@packages/application-sales';

export class MongoShiftSessionRepository implements ShiftSessionRepository {
  async findById(id: string): Promise<ShiftSession | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('shift_sessions').findOne({ _id: id });
    if (!doc) return null;
    return ShiftSession.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      branchId: doc.branch_id,
      cashierId: doc.cashier_id,
      openedAt: doc.opened_at?.toISOString() || new Date().toISOString(),
      closedAt: doc.closed_at?.toISOString() ?? null,
      openingCashPiasters: doc.opening_cash_piasters ?? 0,
      closingCashPiasters: doc.closing_cash_piasters ?? null,
      status: doc.status,
    });
  }

  async findOpenForCashier(
    companyId: string,
    branchId: string,
    cashierId: string,
  ): Promise<ShiftSession | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection<any>('shift_sessions')
      .findOne({ company_id: companyId, branch_id: branchId, cashier_id: cashierId, status: 'open' });
    if (!doc) return null;
    return ShiftSession.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id,
      branchId: doc.branch_id,
      cashierId: doc.cashier_id,
      openedAt: doc.opened_at?.toISOString() || new Date().toISOString(),
      closedAt: doc.closed_at?.toISOString() ?? null,
      openingCashPiasters: doc.opening_cash_piasters ?? 0,
      closingCashPiasters: doc.closing_cash_piasters ?? null,
      status: doc.status,
    });
  }

  async findByCashier(companyId: string, cashierId: string): Promise<ShiftSession[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('shift_sessions')
      .find({ company_id: companyId, cashier_id: cashierId })
      .sort({ opened_at: -1 })
      .toArray();
    return docs.map((doc) =>
      ShiftSession.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id,
        branchId: doc.branch_id,
        cashierId: doc.cashier_id,
        openedAt: doc.opened_at?.toISOString() || new Date().toISOString(),
        closedAt: doc.closed_at?.toISOString() ?? null,
        openingCashPiasters: doc.opening_cash_piasters ?? 0,
        closingCashPiasters: doc.closing_cash_piasters ?? null,
        status: doc.status,
      }),
    );
  }

  async save(session: ShiftSession): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = session as any;
    await db.collection<any>('shift_sessions').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          branch_id: snap.branchId,
          cashier_id: snap.cashierId,
          opened_at: new Date(snap.openedAt),
          closed_at: snap.closedAt ? new Date(snap.closedAt) : null,
          opening_cash_piasters: snap.openingCashPiasters,
          closing_cash_piasters: snap.closingCashPiasters,
          status: snap.status,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }
}
