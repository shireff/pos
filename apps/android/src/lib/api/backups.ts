import { ApiEndpoints, buildEndpoint } from './endpoints';
import type { BackupView, BackupHealth } from '@packages/ui-components';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

async function postJson<T>(url: string, payload?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

async function deleteJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export interface RestoreResult {
  backupId: string;
  restoredCollections: number;
  restoredRows: number;
  requiresRestart: boolean;
}

export interface VerifyResult {
  backupId: string;
  pass: boolean;
  message: string;
}

export const backupsApi = {
  async list(): Promise<BackupView[]> {
    return getJson<BackupView[]>(ApiEndpoints.Backups);
  },
  async create(type?: 'full' | 'incremental' | 'auto'): Promise<{ backupId: string }> {
    return postJson<{ backupId: string }>(ApiEndpoints.Backups, { type });
  },
  async restore(id: string): Promise<RestoreResult> {
    return postJson<RestoreResult>(buildEndpoint(ApiEndpoints.BackupRestore, { id }), {
      confirmText: 'RESTORE',
    });
  },
  async verify(id: string): Promise<VerifyResult> {
    return postJson<VerifyResult>(buildEndpoint(ApiEndpoints.BackupVerify, { id }));
  },
  async remove(id: string): Promise<{ backupId: string; deleted: boolean }> {
    return deleteJson<{ backupId: string; deleted: boolean }>(
      buildEndpoint(ApiEndpoints.BackupById, { id }),
    );
  },
};

export function computeBackupHealth(backups: BackupView[]): BackupHealth {
  const latest = backups
    .filter((b) => !b.deleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latest) {
    return { status: 'none', lastBackupAt: null, hoursSinceLastBackup: null, message: '' };
  }
  const hours = (Date.now() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60);
  return {
    status: hours > 25 ? 'stale' : 'healthy',
    lastBackupAt: latest.createdAt,
    hoursSinceLastBackup: Math.round(hours),
    message: '',
  };
}
