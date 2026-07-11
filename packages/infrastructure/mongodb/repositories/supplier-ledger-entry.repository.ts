import { SupplierLedgerEntry } from '@packages/domain-purchasing';
import { SupplierLedgerEntryRepository } from '@packages/application-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoSupplierLedgerEntryRepository implements SupplierLedgerEntryRepository {
  async findBySupplier(
    supplierId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<SupplierLedgerEntry[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('supplier_ledger_entries')
      .find({ supplier_id: supplierId, company_id: companyId })
      .sort({ occurred_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) =>
      SupplierLedgerEntry.reconstitute({
        id: d._id.toString(),
        supplierId: d.supplier_id.toString(),
        companyId: d.company_id.toString(),
        eventType: d.event_type,
        amountPiasters: d.amount_piasters,
        referenceType: d.reference_type ?? null,
        referenceId: d.reference_id ?? null,
        notes: d.notes ?? null,
        occurredAt: d.occurred_at?.toISOString() || new Date().toISOString(),
        createdAt: d.created_at?.toISOString() || new Date().toISOString(),
      }),
    );
  }

  async append(entry: SupplierLedgerEntry): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    await db.collection<any>('supplier_ledger_entries').insertOne({
      _id: entry.id,
      company_id: entry.companyId,
      supplier_id: entry.supplierId,
      event_type: entry.eventType,
      amount_piasters: entry.amountPiasters,
      reference_type: entry.referenceType,
      reference_id: entry.referenceId,
      notes: entry.notes,
      occurred_at: new Date(entry.occurredAt),
      created_at: now,
    });
  }

  async countBySupplier(supplierId: string, companyId: string): Promise<number> {
    const db = await getMongoDb();
    return db.collection<any>('supplier_ledger_entries').countDocuments({
      supplier_id: supplierId,
      company_id: companyId,
    });
  }

  /**
   * Append-only enforcement: supplier ledger entries must NEVER be modified or
   * removed once recorded. Any UPDATE or DELETE attempt is rejected at the
   * repository boundary so the ledger remains the single source of truth.
   */
  async update(_id: string, _patch: Record<string, unknown>): Promise<void> {
    throw new Error('supplier_ledger_entries is append-only: UPDATE is not permitted');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('supplier_ledger_entries is append-only: DELETE is not permitted');
  }
}
