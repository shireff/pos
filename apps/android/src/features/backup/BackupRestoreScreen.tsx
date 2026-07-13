import React, { useEffect, useMemo, useState } from 'react';
import {
  useT,
  Icon,
  BackupHistoryList,
  BackupHealthIndicator,
  RestoreConfirmDialog,
  BackupProgressBanner,
  type BackupView,
  type BackupProgressStatus,
} from '@packages/ui-components';
import { backupsApi, computeBackupHealth } from '../../lib/api/backups';

export function BackupRestoreScreen(): React.ReactElement {
  const t = useT();

  const [backups, setBackups] = useState<BackupView[]>([]);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState<BackupProgressStatus>('idle');
  const [progressMsg, setProgressMsg] = useState<string | undefined>();

  const [restoreTarget, setRestoreTarget] = useState<BackupView | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const [alert, setAlert] = useState<string | null>(null);

  const health = useMemo(() => computeBackupHealth(backups), [backups]);

  const refresh = async () => {
    setLoading(true);
    try {
      setBackups(await backupsApi.list());
    } catch {
      setAlert(t('backup.failure'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleBackUpNow = async () => {
    setProgress('running');
    setProgressMsg(undefined);
    setAlert(null);
    try {
      await backupsApi.create('auto');
      setProgress('success');
      setProgressMsg(t('backup.success'));
      await refresh();
    } catch {
      setProgress('error');
      setProgressMsg(t('backup.failure'));
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setConfirming(true);
    setRestoreError(null);
    try {
      await backupsApi.restore(restoreTarget.id);
      setAlert(t('backup.restoreRequiresRestart'));
      setRestoreTarget(null);
      await refresh();
    } catch {
      setRestoreError(t('backup.failure'));
    } finally {
      setConfirming(false);
    }
  };

  const handleVerify = async (b: BackupView) => {
    try {
      const res = await backupsApi.verify(b.id);
      setAlert(res.pass ? t('backup.verified') : t('backup.failed'));
    } catch {
      setAlert(t('backup.failed'));
    }
  };

  const handleDelete = async (b: BackupView) => {
    try {
      await backupsApi.remove(b.id);
      setAlert(t('common.delete'));
      await refresh();
    } catch {
      setAlert(t('backup.failure'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('backup.title')}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleBackUpNow}
          disabled={progress === 'running'}
        >
          <Icon name="archive" size={16} />
          {progress === 'running' ? t('backup.backingUp') : t('backup.backUpNow')}
        </button>
      </div>

      {alert && <div className="info-banner">{alert}</div>}
      <BackupProgressBanner status={progress} message={progressMsg} />
      <BackupHealthIndicator health={health} />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('backup.history')}</h2>
        </div>
        <div className="card-body">
          <BackupHistoryList
            backups={backups}
            loading={loading}
            onRestore={setRestoreTarget}
            onVerify={handleVerify}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <RestoreConfirmDialog
        open={Boolean(restoreTarget)}
        backup={restoreTarget}
        confirming={confirming}
        error={restoreError}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}
