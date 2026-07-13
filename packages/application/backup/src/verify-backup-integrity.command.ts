import { IntegrityChecker } from '@packages/infrastructure-backup';
import type { BackupPorts } from './ports';
import { BackupNotFoundError } from './errors';

export interface VerifyBackupIntegrityInput {
  companyId: string;
  backupId: string;
}

export interface VerifyBackupIntegrityOutput {
  backupId: string;
  pass: boolean;
  message: string;
}

/**
 * VerifyBackupIntegrityHandler — reads the backup file (local or remote),
 * computes SHA-256 and compares to the stored checksum. Returns a plain-language
 * pass/fail message. Never throws on corruption — it reports it.
 */
export class VerifyBackupIntegrityHandler {
  public constructor(private readonly ports: BackupPorts) {}

  public async execute(input: VerifyBackupIntegrityInput): Promise<VerifyBackupIntegrityOutput> {
    const manifest = await this.ports.manifests.findById(input.backupId);
    if (!manifest || manifest.deleted) {
      throw new BackupNotFoundError(input.backupId);
    }

    let data: Buffer;
    if (this.ports.fileStore.existsLocal(manifest.id)) {
      data = this.ports.fileStore.readEncrypted(manifest.id);
    } else if (manifest.remoteKey) {
      data = await this.ports.uploader.download(manifest.remoteKey);
    } else {
      throw new BackupNotFoundError(manifest.id);
    }

    const result = IntegrityChecker.verify(data, manifest.checksum);
    await this.ports.manifests.update(manifest.id, { verified: result.pass });
    return { backupId: manifest.id, pass: result.pass, message: result.message };
  }
}
