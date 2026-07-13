import {
  BackupManifest,
  BackupType,
  serializeSnapshot,
  deserializeSnapshot,
  IntegrityChecker,
} from '@packages/infrastructure-backup';
import { eventBus } from '@packages/shared-kernel';
import type { BackupPorts } from './ports';
import { RestoreCompletedEvent } from './events';
import {
  BackupNotFoundError,
  BackupIntegrityError,
  BackupDecryptError,
  RestoreRequiresConfirmationError,
} from './errors';

export interface CreateBackupInput {
  companyId: string;
  /** Explicit type, or 'auto' (default) which picks full on first run. */
  type?: 'full' | 'incremental' | 'auto';
  triggeredBy?: string;
}

export interface CreateBackupOutput {
  backupId: string;
  type: BackupType;
  checksum: string;
  size: number;
  source: 'local';
  remoteKey?: string;
}

export interface CreateBackupCommand {
  companyId: string;
  type: BackupType;
}

/**
 * CreateBackupHandler — triggers a backup: snapshot → compress+encrypt → write
 * local disk → record manifest → enqueue cloud upload (drained immediately if
 * reachable) → enforce retention.
 */
export class CreateBackupHandler {
  public constructor(private readonly ports: BackupPorts) {}

  public async execute(input: CreateBackupInput): Promise<CreateBackupOutput> {
    const { companyId } = input;

    const key = await this.ports.keyProvider.resolveKey();
    const last = await this.ports.manifests.findLatest(companyId);

    const type: BackupType =
      input.type && input.type !== 'auto'
        ? input.type
        : last
          ? 'incremental'
          : 'full';

    const collections = await this.ports.dataSource.snapshot(companyId, {
      full: type === 'full',
      sinceUpdatedAt: type === 'incremental' && last ? last.createdAt : undefined,
    });

    const raw = serializeSnapshot(collections);
    const written = await this.ports.fileStore.write(companyId, raw, key.key);

    const manifest: BackupManifest = {
      id: written.id,
      companyId,
      createdAt: new Date().toISOString(),
      type,
      collections: collections.map((c) => ({ name: c.name, rowCount: c.documents.length })),
      checksum: written.checksum,
      encryptionKeyId: key.keyId,
      size: written.size,
      source: 'local',
      verified: true,
    };

    await this.ports.manifests.save(manifest);

    const remoteKey = await this.uploadToCloud(manifest);

    await this.enforceRetention(companyId);

    return {
      backupId: written.id,
      type,
      checksum: written.checksum,
      size: written.size,
      source: 'local',
      remoteKey,
    };
  }

  private async uploadToCloud(manifest: BackupManifest): Promise<string | undefined> {
    const data = this.ports.fileStore.readEncrypted(manifest.id);
    try {
      const remoteKey = await this.ports.uploader.upload(manifest.id, manifest.companyId, data);
      await this.ports.manifests.update(manifest.id, { remoteKey, source: 'local' });
      return remoteKey;
    } catch {
      // Offline / unreachable — enqueue for later draining.
      await this.ports.uploadQueue.enqueue(manifest, data);
      return undefined;
    }
  }

  private async enforceRetention(companyId: string): Promise<void> {
    const all = await this.ports.manifests.findByCompany(companyId);
    const decision = this.ports.cleanup.evaluate(all);

    for (const manifest of decision.purgeLocal) {
      this.ports.fileStore.deleteLocal(manifest.id);
      await this.ports.manifests.update(manifest.id, {
        deleted: true,
        deletedAt: new Date().toISOString(),
      });
    }

    for (const manifest of decision.purgeRemote) {
      if (manifest.remoteKey) {
        await this.ports.uploader.deleteRemote(manifest.remoteKey).catch(() => undefined);
      }
    }
  }
}

export interface RestoreBackupInput {
  companyId: string;
  backupId?: string;
  timestamp?: string;
  /** Must equal "RESTORE" to prevent accidental triggers (UI_UX.md §3). */
  confirmText: string;
}

export interface RestoreBackupOutput {
  backupId: string;
  restoredCollections: number;
  restoredRows: number;
}

/**
 * RestoreBackupHandler — verifies integrity, applies the snapshot, emits
 * RestoreCompleted. Available even during trial_expired/suspended lock
 * (data-safety carve-out, BR-BAK-004).
 */
export class RestoreBackupHandler {
  public constructor(private readonly ports: BackupPorts) {}

  public async execute(input: RestoreBackupInput): Promise<RestoreBackupOutput> {
    if (input.confirmText !== 'RESTORE') {
      throw new RestoreRequiresConfirmationError();
    }

    const manifest = await this.resolveManifest(input);
    const key = await this.ports.keyProvider.resolveKey();

    const data = await this.loadEncrypted(manifest);

    const integrity = IntegrityChecker.verify(data, manifest.checksum);
    if (!integrity.pass) {
      throw new BackupIntegrityError();
    }

    let raw: Buffer;
    try {
      raw = await this.ports.fileStore.readDecrypted(manifest.id, manifest.checksum, key.key);
    } catch {
      throw new BackupDecryptError();
    }

    const collections = deserializeSnapshot(raw);
    const result = await this.ports.restoreTarget.restoreCollections(
      input.companyId,
      collections,
    );

    await this.ports.manifests.update(manifest.id, { verified: true });
    await eventBus.publish(
      new RestoreCompletedEvent({
        backupId: manifest.id,
        companyId: input.companyId,
        restoredCollections: result.restoredCollections,
        restoredRows: result.restoredRows,
      }),
    );

    return {
      backupId: manifest.id,
      restoredCollections: result.restoredCollections,
      restoredRows: result.restoredRows,
    };
  }

  private async resolveManifest(input: RestoreBackupInput): Promise<BackupManifest> {
    let manifest: BackupManifest | null = null;
    if (input.backupId) {
      manifest = await this.ports.manifests.findById(input.backupId);
    } else if (input.timestamp) {
      manifest = await this.ports.manifests.findByTimestamp(input.companyId, input.timestamp);
    }
    if (!manifest || manifest.deleted) {
      throw new BackupNotFoundError(input.backupId ?? input.timestamp ?? 'unknown');
    }
    return manifest;
  }

  private async loadEncrypted(manifest: BackupManifest): Promise<Buffer> {
    if (this.ports.fileStore.existsLocal(manifest.id)) {
      return this.ports.fileStore.readEncrypted(manifest.id);
    }
    if (manifest.remoteKey) {
      return this.ports.uploader.download(manifest.remoteKey);
    }
    throw new BackupNotFoundError(manifest.id);
  }
}
