import React, { useEffect, useMemo, useState } from 'react';
import {
  useT,
  Icon,
  Modal,
  Field,
  useToast,
  BackupHistoryList,
  BackupHealthIndicator,
  RestoreConfirmDialog,
  BackupProgressBanner,
  type BackupView,
  type BackupProgressStatus,
} from '@packages/ui-components';
import { backupsApi, computeBackupHealth } from '../../lib/api/backups';

const SETTINGS_KEY = 'sro.backup.settings';

interface BackupSettings {
  scheduleTime: string; // HH:MM
  retentionLocal: number;
  retentionRemote: number;
}

const DEFAULT_SETTINGS: BackupSettings = {
  scheduleTime: '02:00',
  retentionLocal: 30,
  retentionRemote: 90,
};

function loadSettings(): BackupSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function BackupRestorePage(): React.ReactElement {
  const t = useT();
  const toast = useToast();

  const [backups, setBackups] = useState<BackupView[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<BackupSettings>(loadSettings);
  const [progress, setProgress] = useState<BackupProgressStatus>('idle');
  const [progressMsg, setProgressMsg] = useState<string | undefined>();

  const [restoreTarget, setRestoreTarget] = useState<BackupView | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const [verifyTarget, setVerifyTarget] = useState<BackupView | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const health = useMemo(() => computeBackupHealth(backups), [backups]);

  const refresh = async () => {
    setLoading(true);
    try {
      setBackups(await backupsApi.list());
    } catch {
      toast.push({ type: 'error', msg: t('backup.failure') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const persistSettings = (next: BackupSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const handleBackUpNow = async () => {
    setProgress('running');
    setProgressMsg(undefined);
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
      toast.push({ type: 'success', msg: t('backup.restoreRequiresRestart') });
      setRestoreTarget(null);
      await refresh();
    } catch {
      setRestoreError(t('backup.failure'));
    } finally {
      setConfirming(false);
    }
  };

  const handleVerify = async (b: BackupView) => {
    setVerifyTarget(b);
    setVerifyMsg(null);
    try {
      const res = await backupsApi.verify(b.id);
      setVerifyMsg(res.pass ? t('backup.verified') : t('backup.failed'));
    } catch {
      setVerifyMsg(t('backup.failed'));
    }
  };

  const handleDelete = async (b: BackupView) => {
    try {
      await backupsApi.remove(b.id);
      toast.push({ type: 'success', msg: t('common.delete') });
      await refresh();
    } catch {
      toast.push({ type: 'error', msg: t('backup.failure') });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('backup.title')}</h1>
        </div>
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

      <BackupProgressBanner status={progress} message={progressMsg} />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('backup.settings')}</h2>
        </div>
        <div className="card-body backup-settings">
          <Field label={t('backup.scheduleTime')} htmlFor="schedule-time">
            <input
              id="schedule-time"
              type="time"
              className="form-input"
              value={settings.scheduleTime}
              onChange={(e) =>
                persistSettings({ ...settings, scheduleTime: e.target.value })
              }
            />
          </Field>
          <Field label={t('backup.retentionLocal')} htmlFor="retention-local">
            <input
              id="retention-local"
              type="number"
              min={1}
              className="form-input"
              value={settings.retentionLocal}
              onChange={(e) =>
                persistSettings({
                  ...settings,
                  retentionLocal: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </Field>
          <Field label={t('backup.retentionRemote')} htmlFor="retention-remote">
            <input
              id="retention-remote"
              type="number"
              min={1}
              className="form-input"
              value={settings.retentionRemote}
              onChange={(e) =>
                persistSettings({
                  ...settings,
                  retentionRemote: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </Field>
        </div>
      </div>

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

      <Modal
        open={Boolean(verifyTarget)}
        onClose={() => setVerifyTarget(null)}
        title={t('backup.verify')}
        footer={
          <button type="button" className="btn btn-ghost" onClick={() => setVerifyTarget(null)}>
            {t('common.close')}
          </button>
        }
      >
        <p>
          {verifyTarget ? new Date(verifyTarget.createdAt).toLocaleString() : ''}
        </p>
        {verifyMsg && <div className="info-banner">{verifyMsg}</div>}
      </Modal>
    </div>
  );
}
