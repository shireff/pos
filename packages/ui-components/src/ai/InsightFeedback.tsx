import { useState } from 'react';
import { useT } from '../i18n';

export interface InsightFeedbackProps {
  open: boolean;
  initialAction?: 'accept' | 'reject' | 'modify';
  onSubmit: (action: 'accept' | 'reject' | 'modify', modifiedValue?: string) => void;
  onClose: () => void;
}

export function InsightFeedback({ open, initialAction = 'accept', onSubmit, onClose }: InsightFeedbackProps) {
  const t = useT();
  const [action, setAction] = useState<'accept' | 'reject' | 'modify'>(initialAction);
  const [modifiedValue, setModifiedValue] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit(action, action === 'modify' ? modifiedValue : undefined);
    onClose();
  };

  return (
    <div className="insight-feedback-modal">
      <div className="insight-feedback-modal__body">
        <h3>{t('ai.insight.feedbackTitle')}</h3>
        <div className="insight-feedback-modal__actions">
          {(['accept', 'reject', 'modify'] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`btn btn-sm ${action === a ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAction(a)}
            >
              {t(`ai.insight.${a}`)}
            </button>
          ))}
        </div>
        {action === 'modify' && (
          <div className="insight-feedback-modal__modify">
            <label className="form-label">{t('ai.insight.modifiedValue')}</label>
            <input
              type="text"
              className="input"
              value={modifiedValue}
              onChange={(e) => setModifiedValue(e.target.value)}
            />
          </div>
        )}
        <div className="insight-feedback-modal__footer">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {t('common.submit')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
