import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * SecretStore — pluggable secret storage for the backup encryption passphrase.
 *
 * The backup encryption key is derived INDEPENDENTLY from the live database
 * encryption key (Security.md §8). A separate credential name
 * (`BACKUP_ENCRYPTION_PASSPHRASE`) is used so that rotation of the backup key
 * never affects the live DB key, and vice-versa.
 */
export interface SecretStore {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
}

/**
 * Environment / file-based secret store. Reads from env first, then falls back
 * to a key file on disk. Safe for local dev, CI, and container deployments
 * (mount a secret file or set the env var).
 */
export class EnvFileSecretStore implements SecretStore {
  private readonly fileDir: string;

  public constructor(fileDir?: string) {
    this.fileDir = fileDir ?? path.resolve(os.homedir(), '.smart_retail_os');
  }

  public async get(name: string): Promise<string | null> {
    const fromEnv = process.env[name];
    if (fromEnv && fromEnv.length > 0) return fromEnv;

    const filePath = path.join(this.fileDir, `.${name}`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8').trim();
    }
    return null;
  }

  public async set(name: string, value: string): Promise<void> {
    process.env[name] = value;
    const filePath = path.join(this.fileDir, `.${name}`);
    fs.mkdirSync(this.fileDir, { recursive: true });
    fs.writeFileSync(filePath, value, { mode: 0o600 });
  }
}

export const BACKUP_PASSPHRASE_SECRET = 'BACKUP_ENCRYPTION_PASSPHRASE';
const BACKUP_KEY_SALT = 'smart-retail-os:backup-key:v1';
const KEY_LENGTH = 32; // AES-256

export interface BackupKey {
  /** 32-byte AES-256 key */
  key: Buffer;
  /** Stable id derived from the passphrase — changes when the key rotates */
  keyId: string;
}

/**
 * BackupKeyProvider derives a 32-byte AES-256 key from a separate backup
 * passphrase. The key is deterministic for a given passphrase (so the same
 * backup can be restored later) and is NEVER the live DB key.
 */
export class BackupKeyProvider {
  private readonly secretStore: SecretStore;

  public constructor(secretStore: SecretStore = new EnvFileSecretStore()) {
    this.secretStore = secretStore;
  }

  /**
   * Resolves (or bootstraps) the backup passphrase and derives the key.
   * If no passphrase exists yet, one is generated and persisted via the store.
   */
  public async resolveKey(): Promise<BackupKey> {
    let passphrase = await this.secretStore.get(BACKUP_PASSPHRASE_SECRET);
    if (!passphrase || passphrase.length === 0) {
      passphrase = this.generatePassphrase();
      await this.secretStore.set(BACKUP_PASSPHRASE_SECRET, passphrase);
    }
    return this.deriveKey(passphrase);
  }

  /**
   * Rotates the backup passphrase, returning a fresh key with a new keyId.
   * Rotation only affects future backups — it does not touch the live DB key.
   */
  public async rotateKey(): Promise<BackupKey> {
    const passphrase = this.generatePassphrase();
    await this.secretStore.set(BACKUP_PASSPHRASE_SECRET, passphrase);
    return this.deriveKey(passphrase);
  }

  private deriveKey(passphrase: string): BackupKey {
    const key = crypto.scryptSync(passphrase, BACKUP_KEY_SALT, KEY_LENGTH);
    const keyId = crypto.createHash('sha256').update(passphrase).digest('hex').slice(0, 16);
    return { key, keyId };
  }

  private generatePassphrase(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
