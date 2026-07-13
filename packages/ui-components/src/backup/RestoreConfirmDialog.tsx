import React, { useState } from 'react';
import { useT, Modal, Icon, Field } from '../index';
import type { BackupView } from './types';

export interface RestoreConfirmDialogProps {
  open: boolean;
  backup?: BackupView | null;
  confirming?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * RestoreConfirmDialog — destructive-action confirmation (UI_UX.md §3).
 * The user must type "RESTORE" to enable the confirm button.
 */
export function RestoreConfirmDialog({
  open,
  backup,
  confirming,
  error,
  onClose,
  onConfirm,
}: RestoreConfirmDialogProps): React.ReactElement {
  const t = useT();
  const [text, setText] = useState('');

  const canConfirm = text === 'RESTORE' && !confirming;

  React.useEffect(() => {
    if (open) setText('');
  }, [open, backup?.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="backup-title-row">
          <Icon name="alert-triangle" size={18} />
          {t('backup.confirmRestore')}
        </span>
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={confirming}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirming ? t('common.loading') : t('backup.restore')}
          </button>
        </>
      }
    >
      <div className="backup-confirm">
        <div className="backup-confirm__warn">
          <Icon name="alert-circle" size={16} />
          <span>{t('backup.confirmRestoreDesc')}</span>
        </div>

        {backup && (
          <div className="backup-confirm__meta">
            <div>
              <span className="section-label">{t('backup.lastBackup')}</span>
              <strong>{new Date(backup.createdAt).toLocaleString()}</strong>
            </div>
            <div>
              <span className="section-label">{t('backup.type')}</span>
              <strong>
                {backup.type === 'full' ? t('backup.typeFull') : t('backup.typeIncremental')}
              </strong>
            </div>
            <div>
              <span className="section-label">{t('backup.size')}</span>
              <strong>{formatSize(backup.size)}</strong>
            </div>
          </div>
        )}

        <Field label={t('backup.confirmText')} htmlFor="restore-confirm-text" required>
          <input
            id="restore-confirm-text"
            className="form-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="RESTORE"
            autoComplete="off"
            dir="ltr"
          />
        </Field>

        {error && <div className="error-banner">{error}</div>}
      </div>
    </Modal>
  );
}
