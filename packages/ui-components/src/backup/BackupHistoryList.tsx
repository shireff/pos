import React from 'react';
import { useT, Icon, formatDate } from '../index';
import type { BackupView } from './types';

export interface BackupHistoryListProps {
  backups: BackupView[];
  loading?: boolean;
  onRestore: (backup: BackupView) => void;
  onVerify: (backup: BackupView) => void;
  onDelete?: (backup: BackupView) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatSource(source: BackupView['source'], localAvailable: boolean): string {
  if (localAvailable) return 'local';
  if (source === 'remote') return 'remote';
  return source;
}

/**
 * BackupHistoryList — table of backups with timestamp, type, source, size,
 * integrity indicator, and per-row Restore / Verify actions.
 */
export function BackupHistoryList({
  backups,
  loading,
  onRestore,
  onVerify,
  onDelete,
}: BackupHistoryListProps): React.ReactElement {
  const t = useT();

  if (loading) {
    return (
      <div className="spinner-wrap">
        <span className="spinner" />
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">
          <Icon name="archive" size={28} />
        </span>
        <div className="empty-state__title">{t('backup.noBackups')}</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>{t('backup.lastBackup')}</th>
              <th>{t('backup.type')}</th>
              <th>{t('backup.source')}</th>
              <th>{t('backup.size')}</th>
              <th>{t('backup.integrity')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td>
                  <div>{formatDate(b.createdAt)}</div>
                  <div className="backup-sub">
                    {t('backup.rowsCount')}: {b.collections.reduce((s, c) => s + c.rowCount, 0)}
                  </div>
                </td>
                <td>
                  <span className={`badge ${b.type === 'full' ? 'badge-ai' : 'badge-draft'}`}>
                    {b.type === 'full' ? t('backup.typeFull') : t('backup.typeIncremental')}
                  </span>
                </td>
                <td>
                  <span className="badge badge-archived">
                    {formatSource(b.source, b.localAvailable) === 'local'
                      ? t('backup.sourceLocal')
                      : t('backup.sourceRemote')}
                  </span>
                </td>
                <td>{formatSize(b.size)}</td>
                <td>
                  {b.verified ? (
                    <span className="badge badge-success">
                      <Icon name="check-circle" size={14} /> {t('backup.verified')}
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      <Icon name="alert-triangle" size={14} /> {t('backup.notVerified')}
                    </span>
                  )}
                </td>
                <td>
                  <div className="backup-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onRestore(b)}
                    >
                      <Icon name="download" size={14} /> {t('backup.restore')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onVerify(b)}
                    >
                      <Icon name="refresh" size={14} /> {t('backup.verify')}
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(b)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
