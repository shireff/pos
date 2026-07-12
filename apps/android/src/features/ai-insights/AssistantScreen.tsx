import React, { useState } from 'react';
import { useT, AssistantPanel, OcrReviewPanel, type OcrField } from '@packages/ui-components';
import { aiAssistantApi, aiOcrApi } from '../../lib/api/ai';
import { CapacitorCameraOcrScanner } from '@packages/infrastructure-hardware';

export function AssistantScreen(): React.ReactElement {
  const t = useT();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrFields, setOcrFields] = useState<OcrField[]>([]);

  const handleSend = async (question: string): Promise<string> => {
    const result = await aiAssistantApi.query(question);
    return result.answer;
  };

  const handleOcrCapture = async () => {
    const scanner = new CapacitorCameraOcrScanner();
    try {
      const imageReference = await scanner.capture();
      const extracted = await aiOcrApi.extract(imageReference);
      const fields: OcrField[] = [
        { key: 'supplier', label: t('ai.ocr.fieldSupplier'), value: String(extracted.supplier ?? '') },
        { key: 'date', label: t('ai.ocr.fieldDate'), value: String(extracted.date ?? '') },
        { key: 'total', label: t('ai.ocr.fieldTotal'), value: String(extracted.total ?? '') },
        ...(extracted.lineItems as Array<{ description: string; total: number }> ?? []).map((item, idx) => ({
          key: `line-${idx}`,
          label: `${t('ai.ocr.fieldLineItem')} ${idx + 1}`,
          value: `${item.description}: ${item.total}`,
        })),
      ];
      setOcrFields(fields);
      setOcrOpen(true);
    } catch {
      // Camera OCR not available on this device
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('ai.assistant.title')}</h1>
          <p className="page-subtitle">{t('ai.assistant.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-primary" onClick={() => setAssistantOpen(true)}>
            {t('ai.assistant.open')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleOcrCapture}>
            {t('ai.ocr.scan')}
          </button>
        </div>
      </div>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} onSend={handleSend} />
      <OcrReviewPanel open={ocrOpen} fields={ocrFields} onApply={(fields) => console.log('OCR applied', fields)} onClose={() => setOcrOpen(false)} />
    </div>
  );
}
