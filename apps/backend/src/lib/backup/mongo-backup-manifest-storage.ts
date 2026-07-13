import { Db } from 'mongodb';
import {
  BackupManifest,
  BackupManifestStorage,
  BackupType,
  BackupSource,
} from '@packages/infrastructure-backup';

interface StoredManifest {
  _id: string;
  company_id: string;
  created_at: Date;
  type: BackupType;
  collections: { name: string; rowCount: number }[];
  checksum: string;
  encryption_key_id: string;
  size: number;
  source: BackupSource;
  remote_key?: string;
  verified: boolean;
  deleted?: boolean;
  deleted_at?: Date;
}

function toStored(m: BackupManifest): StoredManifest {
  return {
    _id: m.id,
    company_id: m.companyId,
    created_at: new Date(m.createdAt),
    type: m.type,
    collections: m.collections,
    checksum: m.checksum,
    encryption_key_id: m.encryptionKeyId,
    size: m.size,
    source: m.source,
    remote_key: m.remoteKey,
    verified: m.verified,
    deleted: m.deleted,
    deleted_at: m.deletedAt ? new Date(m.deletedAt) : undefined,
  };
}

function fromStored(d: StoredManifest): BackupManifest {
  return {
    id: d._id,
    companyId: d.company_id,
    createdAt: d.created_at.toISOString(),
    type: d.type,
    collections: d.collections,
    checksum: d.checksum,
    encryptionKeyId: d.encryption_key_id,
    size: d.size,
    source: d.source,
    remoteKey: d.remote_key,
    verified: d.verified,
    deleted: d.deleted,
    deletedAt: d.deleted_at ? d.deleted_at.toISOString() : undefined,
  };
}

/**
 * MongoBackupManifestStorage — persists backup manifests in `_backup_manifests`.
 * Each device keeps its own history (manifests are not synced across devices).
 */
export class MongoBackupManifestStorage implements BackupManifestStorage {
  public constructor(private readonly db: Db) {}

  private coll() {
    return this.db.collection<StoredManifest>('_backup_manifests');
  }

  public async save(manifest: BackupManifest): Promise<void> {
    await this.coll().insertOne(toStored(manifest));
  }

  public async update(id: string, patch: Partial<BackupManifest>): Promise<void> {
    const set: Partial<StoredManifest> = {};
    if (patch.companyId !== undefined) set.company_id = patch.companyId;
    if (patch.createdAt !== undefined) set.created_at = new Date(patch.createdAt);
    if (patch.type !== undefined) set.type = patch.type;
    if (patch.collections !== undefined) set.collections = patch.collections;
    if (patch.checksum !== undefined) set.checksum = patch.checksum;
    if (patch.encryptionKeyId !== undefined) set.encryption_key_id = patch.encryptionKeyId;
    if (patch.size !== undefined) set.size = patch.size;
    if (patch.source !== undefined) set.source = patch.source;
    if (patch.remoteKey !== undefined) set.remote_key = patch.remoteKey;
    if (patch.verified !== undefined) set.verified = patch.verified;
    if (patch.deleted !== undefined) set.deleted = patch.deleted;
    if (patch.deletedAt !== undefined) set.deleted_at = new Date(patch.deletedAt);
    await this.coll().updateOne({ _id: id }, { $set: set });
  }

  public async findById(id: string): Promise<BackupManifest | null> {
    const doc = await this.coll().findOne({ _id: id });
    return doc ? fromStored(doc) : null;
  }

  public async findByCompany(
    companyId: string,
    opts?: { includeDeleted?: boolean },
  ): Promise<BackupManifest[]> {
    const query: Record<string, unknown> = { company_id: companyId };
    if (!opts?.includeDeleted) query.deleted = { $ne: true };
    const docs = await this.coll().find(query).sort({ created_at: -1 }).toArray();
    return docs.map(fromStored);
  }

  public async findLatest(companyId: string): Promise<BackupManifest | null> {
    const doc = await this.coll()
      .find({ company_id: companyId, deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    return doc[0] ? fromStored(doc[0]) : null;
  }

  public async findByTimestamp(companyId: string, iso: string): Promise<BackupManifest | null> {
    const doc = await this.coll().findOne({
      company_id: companyId,
      created_at: new Date(iso),
      deleted: { $ne: true },
    });
    return doc ? fromStored(doc) : null;
  }
}
