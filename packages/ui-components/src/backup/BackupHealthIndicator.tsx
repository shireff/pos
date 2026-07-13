import React from 'react';
import { useT, Icon, formatDate } from '../index';
import type { BackupHealth } from './types';

export interface BackupHealthIndicatorProps {
  health: BackupHealth;
}

/**
 * BackupHealthIndicator — compact status showing last backup time and
 * success/failure. Turns red (stale) when the last backup is older than 25h.
 */
export function BackupHealthIndicator({
  health,
}: BackupHealthIndicatorProps): React.ReactElement {
  const t = useT();

  const tone =
    health.status === 'healthy'
      ? 'backup-health--ok'
      : health.status === 'stale'
        ? 'backup-health--warn'
        : 'backup-health--none';

  const icon: 'check-circle' | 'alert-triangle' | 'archive' =
    health.status === 'healthy' ? 'check-circle' : health.status === 'stale' ? 'alert-triangle' : 'archive';

  return (
    <div className={`backup-health ${tone}`} role="status" aria-live="polite">
      <span className="backup-health__icon">
        <Icon name={icon} size={20} />
      </span>
      <div className="backup-health__body">
        <div className="backup-health__title">{t('backup.lastBackup')}</div>
        <div className="backup-health__value">
          {health.lastBackupAt ? formatDate(health.lastBackupAt) : t('backup.never')}
        </div>
        <div className="backup-health__msg">{health.message}</div>
      </div>
    </div>
  );
}
