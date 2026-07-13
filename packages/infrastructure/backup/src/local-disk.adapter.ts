import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { BackupPayload, BackupMetadata } from './backup-payload';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const BACKUP_VERSION = 1;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const METADATA_SUFFIX = '.meta.json';
const DATA_SUFFIX = '.enc';

/**
 * LocalDiskAdapter writes and reads encrypted+compressed backup files to local disk.
 * Each backup is stored as:
 *  - `<id>.enc`          — encrypted gzip binary
 *  - `<id>.meta.json`    — metadata (checksum, timestamp, companyId, version)
 */
export class LocalDiskAdapter {
  private readonly backupDir: string;
  private readonly encryptionKey: Buffer;

  /**
   * @param backupDir   — directory where backups are stored
   * @param encryptionKey — 32-byte AES-256 key (derived independently from live DB key per Security.md §8)
   */
  public constructor(backupDir: string, encryptionKey: Buffer) {
    if (encryptionKey.length !== 32) {
      throw new Error('Backup encryption key must be exactly 32 bytes (AES-256).');
    }
    this.backupDir = backupDir;
    this.encryptionKey = encryptionKey;
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  /**
   * Writes a backup to disk.
   * Compresses → Encrypts → Saves with SHA-256 checksum.
   * @param id — optional explicit backup id (UUIDv7). Generated when omitted.
   */
  public async write(companyId: string, rawData: Buffer, id?: string): Promise<BackupMetadata> {
    const backupId = id ?? crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const compressed = await gzip(rawData);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

    const encryptedChunks: Buffer[] = [];
    encryptedChunks.push(cipher.update(compressed));
    encryptedChunks.push(cipher.final());
    const authTag = cipher.getAuthTag();

    const encryptedData = Buffer.concat([iv, authTag, ...encryptedChunks]);

    const checksum = crypto.createHash('sha256').update(encryptedData).digest('hex');

    const dataPath = path.join(this.backupDir, `${backupId}${DATA_SUFFIX}`);
    const metaPath = path.join(this.backupDir, `${backupId}${METADATA_SUFFIX}`);

    fs.writeFileSync(dataPath, encryptedData);

    const metadata: BackupMetadata = {
      id: backupId,
      createdAt,
      checksum,
      companyId,
      version: BACKUP_VERSION,
      filePath: dataPath,
    };

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * Reads and verifies a backup from local disk, then decrypts and decompresses it.
   * Throws a plain-language error if integrity check fails.
   */
  public async read(id: string): Promise<Buffer> {
    const dataPath = path.join(this.backupDir, `${id}${DATA_SUFFIX}`);
    const metaPath = path.join(this.backupDir, `${id}${METADATA_SUFFIX}`);

    if (!fs.existsSync(dataPath) || !fs.existsSync(metaPath)) {
      throw new Error(`Backup not found: ${id}`);
    }

    const encryptedData = fs.readFileSync(dataPath);
    const metaRaw = fs.readFileSync(metaPath, 'utf8');
    const meta = JSON.parse(metaRaw) as BackupMetadata;

    return this.decrypt(encryptedData, meta.checksum);
  }

  /**
   * Returns the raw encrypted bytes for a backup (used for cloud upload).
   */
  public getEncryptedData(id: string): Buffer {
    const dataPath = path.join(this.backupDir, `${id}${DATA_SUFFIX}`);
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Backup not found: ${id}`);
    }
    return fs.readFileSync(dataPath);
  }

  /**
   * Verifies the checksum of an encrypted buffer and decrypts it.
   * Used for restores from remote storage where the file is supplied as a buffer.
   * Throws a plain-language error if integrity check fails.
   */
  public async decrypt(encryptedData: Buffer, expectedChecksum: string): Promise<Buffer> {
    const actualChecksum = crypto.createHash('sha256').update(encryptedData).digest('hex');
    if (actualChecksum !== expectedChecksum) {
      throw new Error(
        `Backup integrity check failed. ` +
          `The backup file may be corrupted or tampered with. ` +
          `Please select a different restore point.`,
      );
    }

    const iv = encryptedData.subarray(0, 12);
    const authTag = encryptedData.subarray(12, 28);
    const ciphertext = encryptedData.subarray(28);

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return await gunzip(decrypted);
  }

  /**
   * Lists available backup snapshots sorted by timestamp (newest first).
   */
  public listSnapshots(): BackupMetadata[] {
    const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith(METADATA_SUFFIX));

    const snapshots = files.map((file) => {
      const raw = fs.readFileSync(path.join(this.backupDir, file), 'utf8');
      return JSON.parse(raw) as BackupMetadata;
    });

    return snapshots.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Returns the BackupPayload for a given backup ID (metadata + encrypted data).
   */
  public async getPayload(id: string): Promise<BackupPayload> {
    const dataPath = path.join(this.backupDir, `${id}${DATA_SUFFIX}`);
    const metaPath = path.join(this.backupDir, `${id}${METADATA_SUFFIX}`);

    if (!fs.existsSync(dataPath) || !fs.existsSync(metaPath)) {
      throw new Error(`Backup not found: ${id}`);
    }

    const encryptedData = fs.readFileSync(dataPath);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as BackupMetadata;

    return {
      id: meta.id,
      createdAt: meta.createdAt,
      checksum: meta.checksum,
      encryptedData,
      iv: encryptedData.subarray(0, 12).toString('hex'),
      version: meta.version,
      companyId: meta.companyId,
    };
  }
}
