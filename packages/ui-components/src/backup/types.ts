export type BackupType = 'full' | 'incremental';
export type BackupSource = 'local' | 'remote';

export interface BackupCollectionStat {
  name: string;
  rowCount: number;
}

export interface BackupView {
  id: string;
  companyId: string;
  createdAt: string;
  type: BackupType;
  collections: BackupCollectionStat[];
  checksum: string;
  encryptionKeyId: string;
  size: number;
  source: BackupSource;
  remoteKey?: string;
  verified: boolean;
  deleted?: boolean;
  deletedAt?: string;
  localAvailable: boolean;
  remoteAvailable: boolean;
}

export interface BackupHealth {
  status: 'healthy' | 'stale' | 'none';
  lastBackupAt: string | null;
  hoursSinceLastBackup: number | null;
  message: string;
}
