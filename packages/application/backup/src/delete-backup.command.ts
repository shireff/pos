import type { BackupPorts } from './ports';
import { BackupNotFoundError } from './errors';

export interface DeleteBackupInput {
  companyId: string;
  backupId: string;
}

export interface DeleteBackupOutput {
  backupId: string;
  deleted: boolean;
}

/**
 * DeleteBackupHandler — soft-deletes a backup from history. The physical file
 * is removed only when the retention policy runs (or immediately if it is also
 * beyond retention). This prevents accidental data loss from a delete click.
 */
export class DeleteBackupHandler {
  public constructor(private readonly ports: BackupPorts) {}

  public async execute(input: DeleteBackupInput): Promise<DeleteBackupOutput> {
    const manifest = await this.ports.manifests.findById(input.backupId);
    if (!manifest || manifest.deleted) {
      throw new BackupNotFoundError(input.backupId);
    }

    await this.ports.manifests.update(manifest.id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    });

    this.ports.fileStore.deleteLocal(manifest.id);
    if (manifest.remoteKey) {
      await this.ports.uploader.deleteRemote(manifest.remoteKey).catch(() => undefined);
    }

    return { backupId: manifest.id, deleted: true };
  }
}
