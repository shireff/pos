import { useState } from 'react';
import { useT } from '../i18n';

export interface OcrField {
  key: string;
  label: string;
  value: string;
}

export interface OcrReviewPanelProps {
  open: boolean;
  fields: OcrField[];
  onApply: (fields: OcrField[]) => void;
  onClose: () => void;
}

export function OcrReviewPanel({ open, fields, onApply, onClose }: OcrReviewPanelProps) {
  const t = useT();
  const [edited, setEdited] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );

  if (!open) return null;

  const handleApply = () => {
    const updated = fields.map((f) => ({ ...f, value: edited[f.key] ?? f.value }));
    onApply(updated);
    onClose();
  };

  return (
    <div className="ocr-review-panel">
      <div className="ocr-review-panel__header">
        <h3>{t('ai.ocr.reviewTitle')}</h3>
        <button type="button" className="ocr-review-panel__close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="ocr-review-panel__body">
        {fields.map((field) => (
          <div key={field.key} className="ocr-review-panel__field">
            <label className="form-label">{field.label}</label>
            <input
              type="text"
              className="input"
              value={edited[field.key] ?? field.value}
              onChange={(e) => setEdited((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="ocr-review-panel__footer">
        <button type="button" className="btn btn-primary" onClick={handleApply}>
          {t('ai.ocr.apply')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
