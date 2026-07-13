import { describe, it, expect } from 'vitest';
import { CleanupPolicy } from './cleanup-policy';
import type { BackupManifest } from './backup-manifest';

function m(id: string, createdAt: string, remoteKey?: string): BackupManifest {
  return {
    id,
    companyId: 'c',
    createdAt,
    type: 'full',
    collections: [],
    checksum: 'x',
    encryptionKeyId: 'k',
    size: 1,
    source: 'local',
    remoteKey,
    verified: true,
  };
}

describe('CleanupPolicy', () => {
  it('keeps the most recent N local backups', () => {
    const policy = new CleanupPolicy({ localRetention: 2, remoteRetention: 90 });
    const now = Date.now();
    const manifests = [
      m('1', new Date(now - 3000).toISOString()),
      m('2', new Date(now - 2000).toISOString()),
      m('3', new Date(now - 1000).toISOString()),
    ];
    const decision = policy.evaluate(manifests);
    expect(decision.purgeLocal.map((x) => x.id).sort()).toEqual(['1']);
    expect(decision.purgeRemote).toHaveLength(0);
  });

  it('purges remote backups beyond remote retention', () => {
    const policy = new CleanupPolicy({ localRetention: 90, remoteRetention: 1 });
    const now = Date.now();
    const manifests = [
      m('1', new Date(now - 2000).toISOString(), 'r1'),
      m('2', new Date(now - 1000).toISOString(), 'r2'),
    ];
    const decision = policy.evaluate(manifests);
    expect(decision.purgeRemote.map((x) => x.id)).toEqual(['1']);
  });

  it('purges deleted backups', () => {
    const policy = new CleanupPolicy({ localRetention: 90, remoteRetention: 90 });
    const now = Date.now();
    const manifests = [m('1', new Date(now - 1000).toISOString(), 'r1'), { ...m('2', new Date(now - 500).toISOString(), 'r2'), deleted: true }];
    const decision = policy.evaluate(manifests);
    expect(decision.purgeLocal.map((x) => x.id)).toContain('2');
  });
});
