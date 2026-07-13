/**
 * BackupDataSource — pluggable source of company data for snapshots.
 *
 * Implementations (e.g. MongoDB) return a snapshot of company-owned documents.
 * Incremental backups capture only documents modified since the last backup
 * using the `updated_at` index.
 */
export interface BackupCollectionSnapshot {
  name: string;
  documents: Record<string, unknown>[];
}

export interface BackupDataSource {
  /** Lists the collections that hold company-scoped data. */
  listCompanyCollections(companyId: string): Promise<string[]>;
  /**
   * Returns a snapshot of company data.
   * @param full             — when true, capture everything; otherwise only
   *                           documents with updated_at >= sinceUpdatedAt.
   * @param sinceUpdatedAt   — ISO timestamp lower bound for incremental captures.
   */
  snapshot(
    companyId: string,
    opts: { full: boolean; sinceUpdatedAt?: string },
  ): Promise<BackupCollectionSnapshot[]>;
}

export interface IncrementalBackupResult {
  collections: BackupCollectionSnapshot[];
  type: 'full' | 'incremental';
}

/**
 * IncrementalBackupEngine decides whether a run is a full or incremental backup
 * and collects the appropriate documents via the BackupDataSource.
 *
 * Rule:
 *  - First run for a company (no prior manifest) → FULL backup.
 *  - Subsequent runs → INCREMENTAL, capturing docs with
 *    updated_at >= last backup timestamp.
 */
export class IncrementalBackupEngine {
  public constructor(private readonly source: BackupDataSource) {}

  public async collect(opts: {
    companyId: string;
    lastBackupAt?: string | null;
  }): Promise<IncrementalBackupResult> {
    const isFull = !opts.lastBackupAt;
    const collections = await this.source.snapshot(opts.companyId, {
      full: isFull,
      sinceUpdatedAt: isFull ? undefined : opts.lastBackupAt ?? undefined,
    });
    return { collections, type: isFull ? 'full' : 'incremental' };
  }
}

export function serializeSnapshot(collections: BackupCollectionSnapshot[]): Buffer {
  return Buffer.from(JSON.stringify({ collections }), 'utf8');
}

export function deserializeSnapshot(raw: Buffer): BackupCollectionSnapshot[] {
  const parsed = JSON.parse(raw.toString('utf8')) as { collections: BackupCollectionSnapshot[] };
  return parsed.collections;
}
