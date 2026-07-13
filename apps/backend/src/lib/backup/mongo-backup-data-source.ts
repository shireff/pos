import { Db } from 'mongodb';
import { BackupCollectionSnapshot, BackupDataSource } from '@packages/infrastructure-backup';

/**
 * System/identity/subscription/bookkeeping collections excluded from backup
 * and restore. Backing these up would risk lock/security state leakage.
 */
const EXCLUDED_COLLECTIONS = new Set<string>([
  '_migrations',
  '_backup_manifests',
  '_backup_queue',
  'subscriptions',
  'sessions',
  'outbox',
  'encryption',
  '__keyVault',
  'roles',
  'permissions',
  'role_permissions',
  'user_branch_roles',
  'users',
  'devices',
  'platform_admin_accounts',
  'platform_admin_audit',
]);

function isExcluded(name: string): boolean {
  if (name.startsWith('_')) return true;
  if (name.startsWith('platform_admin_')) return true;
  return EXCLUDED_COLLECTIONS.has(name);
}

/**
 * Converts a Mongo document to a plain JSON-safe object (ObjectId → string,
 * Date → ISO, nested objects/arrays recursed).
 */
function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toPlain);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown> & { _bsontype?: string };
    if (obj._bsontype) {
      if (obj._bsontype === 'Decimal128') return (value as { toString(): string }).toString();
      return (value as { toString(): string }).toString();
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = toPlain(v);
    return out;
  }
  return value;
}

/**
 * MongoBackupDataSource — snapshots company-scoped collections. Incremental
 * runs capture only documents with updated_at >= sinceUpdatedAt (updatedAt
 * index).
 */
export class MongoBackupDataSource implements BackupDataSource {
  public constructor(private readonly db: Db) {}

  public async listCompanyCollections(companyId: string): Promise<string[]> {
    const names = (await this.db.listCollections({}, { nameOnly: true }).toArray()).map(
      (c) => c.name,
    );
    const result: string[] = [];
    for (const name of names) {
      if (isExcluded(name)) continue;
      const doc = await this.db.collection(name).findOne({ company_id: companyId });
      if (doc) result.push(name);
    }
    return result;
  }

  public async snapshot(
    companyId: string,
    opts: { full: boolean; sinceUpdatedAt?: string },
  ): Promise<BackupCollectionSnapshot[]> {
    const collections = await this.listCompanyCollections(companyId);
    const out: BackupCollectionSnapshot[] = [];

    for (const name of collections) {
      const query: Record<string, unknown> = { company_id: companyId };
      if (!opts.full && opts.sinceUpdatedAt) {
        query.updated_at = { $gte: new Date(opts.sinceUpdatedAt) };
      }
      const docs = await this.db.collection(name).find(query).toArray();
      out.push({
        name,
        documents: docs.map((d) => toPlain(d) as Record<string, unknown>),
      });
    }

    return out;
  }
}
