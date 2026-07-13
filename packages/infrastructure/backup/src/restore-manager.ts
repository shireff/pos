import type { BackupCollectionSnapshot } from './incremental-backup';

/**
 * RestoreTarget — applies a decrypted snapshot back to the datastore.
 * Implementations (e.g. MongoDB) replace company data per collection.
 */
export interface RestoreTarget {
  restoreCollections(
    companyId: string,
    collections: BackupCollectionSnapshot[],
  ): Promise<{ restoredCollections: number; restoredRows: number }>;
}

export interface RestoreResult {
  backupId: string;
  restoredCollections: number;
  restoredRows: number;
}

/**
 * RestoreManager decrypts (handled upstream) snapshot bytes and applies them to
 * the RestoreTarget. It is intentionally a destructive, confirmation-gated
 * operation performed only after integrity verification.
 */
export class RestoreManager {
  public constructor(private readonly target: RestoreTarget) {}

  public async apply(
    backupId: string,
    companyId: string,
    collections: BackupCollectionSnapshot[],
  ): Promise<RestoreResult> {
    const summary = await this.target.restoreCollections(companyId, collections);
    return {
      backupId,
      restoredCollections: summary.restoredCollections,
      restoredRows: summary.restoredRows,
    };
  }
}
