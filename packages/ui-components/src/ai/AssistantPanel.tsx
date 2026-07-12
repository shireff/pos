import { useState, useRef, useEffect } from 'react';
import { useT } from '../i18n';
import { Modal, Spinner } from '../components/ui';

export interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onSend: (question: string) => Promise<string>;
}

export function AssistantPanel({ open, onClose, onSend }: AssistantPanelProps) {
  const t = useT();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const answer = await onSend(question);
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('ai.assistant.error') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('ai.assistant.title')} size="lg">
      <div className="assistant-panel">
        <div className="assistant-panel__messages">
          {messages.length === 0 && (
            <div className="assistant-panel__empty">{t('ai.assistant.welcome')}</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`assistant-panel__message assistant-panel__message--${m.role}`}>
              <div className="assistant-panel__bubble">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="assistant-panel__message assistant-panel__message--assistant">
              <Spinner label={t('ai.assistant.thinking')} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="assistant-panel__input-row">
          <input
            type="text"
            className="assistant-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('ai.assistant.placeholder')}
            disabled={loading}
          />
          <button type="button" className="btn btn-primary" onClick={handleSend} disabled={loading}>
            {t('ai.assistant.send')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
