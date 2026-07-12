import { useState } from 'react';
import { useT } from '../i18n';
import { AISourceBadge } from './AISourceBadge';

export interface InsightCardProps {
  id: string;
  type: string;
  headline: string;
  supportingData?: Record<string, unknown>;
  narrative: string;
  source: string;
  generatedAt: string;
  onFeedback?: (insightId: string, action: 'accept' | 'reject' | 'modify', modifiedValue?: string) => void;
}

export function InsightCard({ id, type, headline, supportingData, narrative, source, generatedAt, onFeedback }: InsightCardProps) {
  const t = useT();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'accept' | 'reject' | 'modify'>('accept');
  const [modifiedValue, setModifiedValue] = useState('');

  const handleSubmit = () => {
    onFeedback?.(id, feedbackAction, feedbackAction === 'modify' ? modifiedValue : undefined);
    setShowFeedback(false);
  };

  return (
    <div className="insight-card" data-testid={`insight-card-${id}`}>
      <div className="insight-card__header">
        <span className="insight-card__type">{type}</span>
        <AISourceBadge source={source} />
      </div>
      <div className="insight-card__headline">{headline}</div>
      {supportingData && (
        <pre className="insight-card__data">{JSON.stringify(supportingData, null, 2)}</pre>
      )}
      <div className="insight-card__narrative">{narrative}</div>
      <div className="insight-card__footer">
        <span className="insight-card__date">{new Date(generatedAt).toLocaleString()}</span>
        <div className="insight-card__actions">
          <button type="button" className="btn btn-sm btn-success" onClick={() => { setFeedbackAction('accept'); setShowFeedback(true); }}>
            {t('ai.insight.accept')}
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => { setFeedbackAction('reject'); setShowFeedback(true); }}>
            {t('ai.insight.reject')}
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setFeedbackAction('modify'); setShowFeedback(true); }}>
            {t('ai.insight.modify')}
          </button>
        </div>
      </div>
      {showFeedback && (
        <div className="insight-card__feedback-overlay">
          <div className="insight-card__feedback-form">
            <h4>{t('ai.insight.feedbackTitle')}</h4>
            {feedbackAction === 'modify' && (
              <div className="insight-card__modify-field">
                <label className="form-label">{t('ai.insight.modifiedValue')}</label>
                <input
                  type="text"
                  className="input"
                  value={modifiedValue}
                  onChange={(e) => setModifiedValue(e.target.value)}
                />
              </div>
            )}
            <div className="insight-card__feedback-actions">
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                {t('common.submit')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowFeedback(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
