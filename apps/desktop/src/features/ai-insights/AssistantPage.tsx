import React, { useState } from 'react';
import { useT, AssistantPanel } from '@packages/ui-components';
import { aiAssistantApi } from '../../lib/api/ai';

export function AssistantPage(): React.ReactElement {
  const t = useT();
  const [open, setOpen] = useState(false);

  const handleSend = async (question: string): Promise<string> => {
    const result = await aiAssistantApi.query(question);
    return result.answer;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('ai.assistant.title')}</h1>
          <p className="page-subtitle">{t('ai.assistant.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          {t('ai.assistant.open')}
        </button>
      </div>
      <AssistantPanel open={open} onClose={() => setOpen(false)} onSend={handleSend} />
    </div>
  );
}
