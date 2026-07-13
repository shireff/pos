import React from 'react';
import { useT, Icon } from '../index';

export type BackupProgressStatus = 'idle' | 'running' | 'success' | 'error';

export interface BackupProgressBannerProps {
  status: BackupProgressStatus;
  message?: string;
}

/**
 * BackupProgressBanner — shows the live status of a manual/auto backup:
 * running spinner, success, or error.
 */
export function BackupProgressBanner({
  status,
  message,
}: BackupProgressBannerProps): React.ReactElement | null {
  const t = useT();

  if (status === 'idle') return null;

  const tone =
    status === 'running'
      ? 'backup-progress--running'
      : status === 'success'
        ? 'backup-progress--ok'
        : 'backup-progress--error';

  return (
    <div className={`backup-progress ${tone}`} role="status" aria-live="polite">
      {status === 'running' ? (
        <span className="spinner spinner--sm" />
      ) : status === 'success' ? (
        <Icon name="check-circle" size={16} />
      ) : (
        <Icon name="alert-circle" size={16} />
      )}
      <span className="backup-progress__msg">
        {message ??
          (status === 'running'
            ? t('backup.backingUp')
            : status === 'success'
              ? t('backup.success')
              : t('backup.failure'))}
      </span>
    </div>
  );
}
