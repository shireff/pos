import type { BackupManifest } from '@packages/infrastructure-backup';
import type { BackupPorts } from './ports';

export interface ListBackupsInput {
  companyId: string;
}

export interface BackupView extends BackupManifest {
  /** Local availability (file present on this device) */
  localAvailable: boolean;
  /** Remote availability (uploaded to cloud) */
  remoteAvailable: boolean;
}

export interface ListBackupsOutput {
  backups: BackupView[];
}

/**
 * ListBackupsHandler — union of local + remote manifests, newest first.
 * Each device maintains its own history (manifests are not synced).
 */
export class ListBackupsHandler {
  public constructor(private readonly ports: BackupPorts) {}

  public async execute(input: ListBackupsInput): Promise<ListBackupsOutput> {
    const local = await this.ports.manifests.findByCompany(input.companyId);

    const backups: BackupView[] = local
      .filter((m) => !m.deleted)
      .map((m) => ({
        ...m,
        localAvailable: this.ports.fileStore.existsLocal(m.id),
        remoteAvailable: Boolean(m.remoteKey),
      }))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return { backups };
  }
}
