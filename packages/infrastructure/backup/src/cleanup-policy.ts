import type { BackupManifest } from './backup-manifest';

export interface RetentionConfig {
  /** Max local backups to keep (default 30) */
  localRetention: number;
  /** Max remote backups to keep (default 90) */
  remoteRetention: number;
}

export const DEFAULT_RETENTION: RetentionConfig = {
  localRetention: 30,
  remoteRetention: 90,
};

export interface CleanupDecision {
  /** Manifests whose files should be purged locally */
  purgeLocal: BackupManifest[];
  /** Manifests whose files should be purged remotely */
  purgeRemote: BackupManifest[];
}

/**
 * CleanupPolicy enforces backup retention. After each backup, local backups
 * beyond `localRetention` and remote backups beyond `remoteRetention` are
 * purged (most recent N are always retained). Soft-deleted backups are
 * eligible for immediate purge.
 */
export class CleanupPolicy {
  public constructor(private readonly config: RetentionConfig = DEFAULT_RETENTION) {}

  public evaluate(manifests: BackupManifest[]): CleanupDecision {
    const active = manifests
      .filter((m) => !m.deleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const localKeep = new Set(active.slice(0, this.config.localRetention).map((m) => m.id));
    const remoteKeep = new Set(active.slice(0, this.config.remoteRetention).map((m) => m.id));

    const purgeLocal: BackupManifest[] = [];
    const purgeRemote: BackupManifest[] = [];

    for (const m of manifests) {
      if (m.deleted) {
        purgeLocal.push(m);
        if (m.remoteKey) purgeRemote.push(m);
        continue;
      }
      if (!localKeep.has(m.id)) purgeLocal.push(m);
      if (m.remoteKey && !remoteKeep.has(m.id)) purgeRemote.push(m);
    }

    return {
      purgeLocal: dedupeById(purgeLocal),
      purgeRemote: dedupeById(purgeRemote),
    };
  }
}

function dedupeById(items: BackupManifest[]): BackupManifest[] {
  const seen = new Set<string>();
  const out: BackupManifest[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}
