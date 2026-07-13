import * as fs from 'fs';
import * as path from 'path';
import { Identifier } from '@packages/shared-kernel';
import {
  LocalDiskAdapter,
  BackupKeyProvider,
} from '@packages/infrastructure-backup';
import type { BackupFileStore } from '@packages/application-backup';

const DATA_SUFFIX = '.enc';
const META_SUFFIX = '.meta.json';

/**
 * LocalBackupFileStore — wraps LocalDiskAdapter for the backup lifecycle.
 * The encryption key is resolved per operation from the (independent) backup
 * key provider, keeping it separate from the live DB key.
 */
export class LocalBackupFileStore implements BackupFileStore {
  public constructor(
    private readonly backupDir: string,
    private readonly keyProvider: BackupKeyProvider,
  ) {}

  public async write(
    companyId: string,
    rawData: Buffer,
    key: Buffer,
  ): Promise<{ id: string; checksum: string; size: number }> {
    const id = Identifier.generate();
    const adapter = new LocalDiskAdapter(this.backupDir, key);
    const meta = await adapter.write(companyId, rawData, id);
    const size = fs.statSync(meta.filePath as string).size;
    return { id: meta.id, checksum: meta.checksum, size };
  }

  public readEncrypted(id: string): Buffer {
    const adapter = new LocalDiskAdapter(this.backupDir, Buffer.alloc(32));
    return adapter.getEncryptedData(id);
  }

  public async readDecrypted(
    id: string,
    expectedChecksum: string,
    key: Buffer,
  ): Promise<Buffer> {
    const adapter = new LocalDiskAdapter(this.backupDir, key);
    return adapter.decrypt(this.readEncrypted(id), expectedChecksum);
  }

  public existsLocal(id: string): boolean {
    return fs.existsSync(path.join(this.backupDir, `${id}${DATA_SUFFIX}`));
  }

  public deleteLocal(id: string): void {
    const dataPath = path.join(this.backupDir, `${id}${DATA_SUFFIX}`);
    const metaPath = path.join(this.backupDir, `${id}${META_SUFFIX}`);
    if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  }
}
