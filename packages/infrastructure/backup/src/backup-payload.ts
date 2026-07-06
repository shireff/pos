/**
 * BackupPayload describes the structure of a backup archive:
 * - Encrypted (AES-256 key derived independently from live DB key per Security.md §8)
 * - Compressed (gzip)
 * - Timestamped
 * - Includes SHA-256 integrity checksum
 */
export interface BackupPayload {
  /** UUIDv7 identifier for this backup */
  id: string;
  /** UTC ISO timestamp of when this backup was created */
  createdAt: string;
  /** SHA-256 hex checksum of the compressed+encrypted data */
  checksum: string;
  /** AES-256-GCM encrypted binary (gzip compressed data) */
  encryptedData: Buffer;
  /** Random IV used for AES-GCM encryption */
  iv: string;
  /** Version of the backup format (incremented on schema changes) */
  version: number;
  /** Company ID this backup belongs to */
  companyId: string;
}

/**
 * BackupMetadata contains lightweight info about a backup without the encrypted blob.
 */
export interface BackupMetadata {
  id: string;
  createdAt: string;
  checksum: string;
  companyId: string;
  version: number;
  filePath?: string;
  remoteKey?: string;
}
