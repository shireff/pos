import { Db, Collection } from 'mongodb';
import { SyncConflict } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { ConflictStore } from '@packages/application-sync';

interface ConflictDoc {
  _id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  field: string;
  local_value: unknown;
  remote_value: unknown;
  local_hlc: string;
  remote_hlc: string;
  status: 'unresolved' | 'resolved_local' | 'resolved_remote' | 'resolved_merge';
  resolved_by?: string | null;
  resolved_at?: Date | null;
  audit_trail: unknown[];
  created_at: Date;
}

/** MongoDB-backed ConflictStore. Persists SyncConflict records until resolved. */
export class MongoConflictRepository implements ConflictStore {
  private readonly collection: Collection<ConflictDoc>;

  public constructor(db: Db, collectionName = 'sync_conflicts') {
    this.collection = db.collection<ConflictDoc>(collectionName);
  }

  private static toDoc(conflict: SyncConflict): ConflictDoc {
    const last = conflict.auditTrail.at(-1);
    return {
      _id: conflict.id,
      company_id: conflict.companyId,
      entity_type: conflict.entityType,
      entity_id: conflict.entityId,
      field: conflict.field,
      local_value: conflict.localValue,
      remote_value: conflict.remoteValue,
      local_hlc: conflict.localHlc.toString(),
      remote_hlc: conflict.remoteHlc.toString(),
      status: conflict.status,
      resolved_by: last ? (last as { byUserId: string | null }).byUserId : null,
      resolved_at: last ? new Date((last as { at: string }).at) : null,
      audit_trail: [...conflict.auditTrail],
      created_at: new Date(conflict.createdAt),
    };
  }

  private static toConflict(doc: ConflictDoc): SyncConflict {
    return SyncConflict.reconstitute({
      id: doc._id,
      companyId: doc.company_id,
      entityType: doc.entity_type,
      entityId: doc.entity_id,
      field: doc.field,
      localValue: doc.local_value,
      remoteValue: doc.remote_value,
      localHlc: HybridLogicalClock.parse(doc.local_hlc),
      remoteHlc: HybridLogicalClock.parse(doc.remote_hlc),
      status: doc.status,
      auditTrail: (doc.audit_trail ?? []).map((e) => e as never),
      createdAt: doc.created_at.toISOString(),
    });
  }

  public async save(conflict: SyncConflict): Promise<void> {
    await this.collection.updateOne(
      { _id: conflict.id },
      { $set: MongoConflictRepository.toDoc(conflict) },
      { upsert: true },
    );
  }

  public async findPending(companyId: string): Promise<SyncConflict[]> {
    const docs = await this.collection.find({ company_id: companyId, status: 'unresolved' }).toArray();
    return docs.map(MongoConflictRepository.toConflict);
  }

  public async findPendingPaginated(
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<SyncConflict[]> {
    const docs = await this.collection
      .find({ company_id: companyId, status: 'unresolved' })
      .sort({ created_at: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(MongoConflictRepository.toConflict);
  }

  public async findById(id: string): Promise<SyncConflict | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? MongoConflictRepository.toConflict(doc) : null;
  }
}
