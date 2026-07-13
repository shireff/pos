/**
 * BackupManifest — authoritative metadata record for a single backup.
 *
 * Persisted in the `_backup_manifests` collection. Each device maintains its
 * own backup history locally (sync rule: manifests are NOT synced between
 * devices).
 */
export type BackupType = 'full' | 'incremental';
export type BackupSource = 'local' | 'remote';

export interface BackupCollectionStat {
  name: string;
  rowCount: number;
}

export interface BackupManifest {
  /** UUIDv7 identifier for this backup */
  id: string;
  companyId: string;
  /** UTC ISO timestamp of when this backup was created */
  createdAt: string;
  type: BackupType;
  /** Per-collection row counts captured in this backup */
  collections: BackupCollectionStat[];
  /** SHA-256 hex checksum of the compressed+encrypted data file */
  checksum: string;
  /** Id of the backup encryption key used (independent from live DB key) */
  encryptionKeyId: string;
  /** Size of the encrypted file in bytes */
  size: number;
  /** Where the backup file currently lives (local disk and/or remote) */
  source: BackupSource;
  /** Supabase Storage key when uploaded to the cloud */
  remoteKey?: string;
  /** Whether the backup file's integrity has been verified */
  verified: boolean;
  /** Soft-delete flag — files are purged only by the retention policy */
  deleted?: boolean;
  deletedAt?: string;
}

export interface BackupManifestStorage {
  save(manifest: BackupManifest): Promise<void>;
  update(id: string, patch: Partial<BackupManifest>): Promise<void>;
  findById(id: string): Promise<BackupManifest | null>;
  findByCompany(companyId: string, opts?: { includeDeleted?: boolean }): Promise<BackupManifest[]>;
  findLatest(companyId: string): Promise<BackupManifest | null>;
  findByTimestamp(companyId: string, iso: string): Promise<BackupManifest | null>;
}

export const BACKUP_MANIFESTS_COLLECTION = '_backup_manifests';

export function totalRows(manifest: BackupManifest): number {
  return manifest.collections.reduce((sum, c) => sum + c.rowCount, 0);
}

export function describeBackupType(type: BackupType): string {
  return type === 'full' ? 'full' : 'incremental';
}
